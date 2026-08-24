import { supabase } from '../config/supabase';

export const wishlistService = {

  async getAll(customerId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, marketplace_products(id, name, slug, image_url, mrp, selling_price, discount_percent, unit, weight_value, stock_quantity, avg_rating, is_active)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    // Filter out inactive products
    return (data || []).filter((item: any) => item.marketplace_products?.is_active);
  },

  async add(customerId: string, productId: string) {
    const { data: product } = await supabase
      .from('marketplace_products')
      .select('id').eq('id', productId).eq('is_active', true).single();
    if (!product) throw new Error('Product not found');

    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .single();
    if (existing) throw new Error('Already in wishlist');

    const { data, error } = await supabase
      .from('wishlists')
      .insert({ customer_id: customerId, product_id: productId })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(customerId: string, productId: string) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('customer_id', customerId)
      .eq('product_id', productId);
    if (error) throw new Error(error.message);
    return { removed: true };
  },

  async isInWishlist(customerId: string, productId: string) {
    const { data } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .single();
    return { in_wishlist: !!data };
  },

  async moveToCart(customerId: string, productId: string) {
    // Remove from wishlist
    await this.remove(customerId, productId);
    // This will be combined with cart.addItem in the controller
    return { moved: true };
  },
};
