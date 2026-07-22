import { supabase } from '../config/supabase';

export const farmerService = {

  async getRates(area?: string) {
    let query = supabase
      .from('area_rates').select('*')
      .eq('is_active', true).order('category');
    if (area) query = query.eq('area', area);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createPickup(farmerId: string, dto: any) {
    const { data: profile } = await supabase
      .from('farmer_profiles').select('area').eq('user_id', farmerId).single();

    let rate_per_kg = null;
    let estimated_amount = null;

    if (profile) {
      const { data: rate } = await supabase
        .from('area_rates').select('rate_per_kg')
        .eq('area', profile.area).eq('item_name', dto.item_name)
        .eq('category', dto.category).eq('is_active', true)
        .order('effective_date', { ascending: false }).limit(1).single();
      if (rate) {
        rate_per_kg = rate.rate_per_kg;
        estimated_amount = rate_per_kg * dto.weight_kg;
      }
    }

    const { data, error } = await supabase
      .from('pickup_requests')
      .insert({
        farmer_id: farmerId,
        category: dto.category,
        item_name: dto.item_name,
        weight_kg: dto.weight_kg,
        rate_per_kg,
        estimated_amount,
        pickup_address: dto.pickup_address_readable || dto.pickup_address || '',
        pickup_latitude: dto.pickup_latitude || null,
        pickup_longitude: dto.pickup_longitude || null,
        pickup_address_readable: dto.pickup_address_readable || null,
        pickup_landmark: dto.pickup_landmark || null,
        location_set_at: dto.location_set_at || null,
        preferred_date: dto.preferred_date,
        notes: dto.notes || null,
        status: 'created',
      }).select().single();
    if (error) throw new Error(error.message);

    await supabase.from('status_logs').insert({
      pickup_id: data.id, old_status: null, new_status: 'created',
      changed_by: farmerId, notes: 'Pickup request created by farmer',
    });

    return data;
  },

  async getMyPickups(farmerId: string, status?: string) {
    let query = supabase
      .from('pickup_requests')
      .select('*, agent:assigned_agent_id(id, name, phone)')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getPickupById(pickupId: string, farmerId: string) {
    const { data, error } = await supabase
      .from('pickup_requests')
      .select('*, agent:assigned_agent_id(id, name, phone), status_logs(*)')
      .eq('id', pickupId).eq('farmer_id', farmerId).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getMyBills(farmerId: string) {
    const { data, error } = await supabase
      .from('bills')
      .select('*, items:bill_items(item_name, category, weight_kg, rate_per_kg, amount), payment:payments(status, paid_at, payout_reference_id, amount)')
      .eq('farmer_id', farmerId)
      .order('year', { ascending: false }).order('month', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getPaymentHistory(farmerId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*, bill:bill_id(bill_number, month, year, total_amount)')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getProfile(farmerId: string) {
    const { data: user } = await supabase
      .from('users').select('*').eq('id', farmerId).single();
    const { data: profile } = await supabase
      .from('farmer_profiles').select('*').eq('user_id', farmerId).single();
    const { data: bank } = await supabase
      .from('farmer_bank_details').select('account_holder_name, bank_name, ifsc_code').eq('farmer_id', farmerId).single();
    return { ...user, profile, bank };
  },
};
