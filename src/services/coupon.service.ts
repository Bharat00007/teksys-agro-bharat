import { supabase } from '../config/supabase';

export const couponService = {

  async validate(customerId: string, code: string, orderAmount: number) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!coupon) throw new Error('Invalid coupon code');
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) throw new Error('Coupon expired');
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new Error('Coupon usage limit reached');
    if (orderAmount < coupon.min_order_amount) throw new Error(`Minimum order amount is ₹${coupon.min_order_amount}`);

    const { data: used } = await supabase
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('customer_id', customerId)
      .single();
    if (used) throw new Error('Coupon already used');

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (orderAmount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.discount_value;
    }

    return {
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: Math.round(discount * 100) / 100,
      min_order_amount: coupon.min_order_amount,
    };
  },

  async getAvailableCoupons(customerId: string) {
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Filter out already used coupons
    const available = [];
    for (const coupon of coupons || []) {
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) continue;
      const { data: used } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('customer_id', customerId)
        .single();
      if (!used) available.push(coupon);
    }

    return available;
  },

  // Admin methods
  async create(dto: any) {
    const { data, error } = await supabase
      .from('coupons')
      .insert({ ...dto, code: dto.code.toUpperCase() })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, dto: any) {
    const { data, error } = await supabase
      .from('coupons')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  },

  async getAll() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },
};
