import { supabase } from '../config/supabase';

export const notificationService = {

  async getAll(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    return {
      notifications: data || [],
      pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
      unread_count: (data || []).filter((n: any) => !n.is_read).length,
    };
  },

  async markAsRead(userId: string, notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return { read: true };
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
    return { read_all: true };
  },

  async getUnreadCount(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return { unread_count: count || 0 };
  },

  async create(userId: string, dto: {
    type: string; title: string; body: string; data?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, ...dto })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },
};
