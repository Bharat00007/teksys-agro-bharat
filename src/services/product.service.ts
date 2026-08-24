import { supabase } from '../config/supabase';

export const productService = {

  async getAll(query: {
    page?: number; limit?: number; category_id?: string; search?: string;
    is_organic?: boolean; min_price?: number; max_price?: number;
    min_rating?: number; sort_by?: string; sort_order?: string;
    is_featured?: boolean; is_trending?: boolean; is_best_seller?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let q = supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)', { count: 'exact' })
      .eq('is_active', true);

    if (query.category_id) q = q.eq('category_id', query.category_id);
    if (query.search) q = q.ilike('name', `%${query.search}%`);
    if (query.is_organic !== undefined) q = q.eq('is_organic', query.is_organic);
    if (query.min_price) q = q.gte('selling_price', query.min_price);
    if (query.max_price) q = q.lte('selling_price', query.max_price);
    if (query.min_rating) q = q.gte('avg_rating', query.min_rating);
    if (query.is_featured) q = q.eq('is_featured', true);
    if (query.is_trending) q = q.eq('is_trending', true);
    if (query.is_best_seller) q = q.eq('is_best_seller', true);

    // Sorting
    const sortField = query.sort_by || 'created_at';
    const ascending = query.sort_order === 'asc';
    q = q.order(sortField, { ascending });

    q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
      products: data || [],
      pagination: {
        page, limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  },

  async getById(id: string) {
    const { data: product, error } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('id', id)
      .single();
    if (error) throw new Error('Product not found');

    // Fetch images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true });

    // Fetch reviews (latest 10)
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    return { ...product, images: images || [], reviews: reviews || [] };
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('id')
      .eq('slug', slug)
      .single();
    if (error) throw new Error('Product not found');
    return this.getById(data.id);
  },

  async getSimilar(productId: string, limit = 10) {
    const { data: product } = await supabase
      .from('marketplace_products')
      .select('category_id')
      .eq('id', productId)
      .single();
    if (!product) return [];

    const { data } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('category_id', product.category_id)
      .eq('is_active', true)
      .neq('id', productId)
      .limit(limit);

    return data || [];
  },

  async getFeatured(limit = 10) {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async getTrending(limit = 10) {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('is_active', true)
      .eq('is_trending', true)
      .order('total_sold', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async getBestSellers(limit = 10) {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('is_active', true)
      .eq('is_best_seller', true)
      .order('total_sold', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async getRecentlyAdded(limit = 10) {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async searchSuggestions(query: string, limit = 10) {
    const { data } = await supabase
      .from('marketplace_products')
      .select('id, name, slug, image_url, selling_price')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(limit);
    return data || [];
  },

  // Admin methods
  async create(dto: any) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .insert(dto)
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, dto: any) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('marketplace_products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  },

  async addImage(productId: string, dto: { image_url: string; sort_order?: number; is_primary?: boolean }) {
    const { data, error } = await supabase
      .from('product_images')
      .insert({ product_id: productId, ...dto })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteImage(imageId: string) {
    const { error } = await supabase
      .from('product_images')
      .delete().eq('id', imageId);
    if (error) throw new Error(error.message);
    return { deleted: true };
  },
};
