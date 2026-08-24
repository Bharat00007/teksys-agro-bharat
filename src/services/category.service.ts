import { supabase } from '../config/supabase';

export const categoryService = {

  async getAll() {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error('Category not found');
    return data;
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (error) throw new Error('Category not found');
    return data;
  },

  // Admin methods
  async create(dto: {
    name: string; slug: string; description?: string;
    image_url?: string; icon_name?: string; sort_order?: number;
  }) {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .insert(dto)
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, dto: any) {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('marketplace_categories')
      .delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  },
};
