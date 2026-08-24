import { supabase } from '../config/supabase';

export const reviewService = {

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, users(name)', { count: 'exact' })
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    return {
      reviews: data || [],
      pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
    };
  },

  async create(customerId: string, dto: {
    product_id: string; order_id?: string; rating: number;
    title?: string; comment?: string; images?: string[];
  }) {
    if (dto.rating < 1 || dto.rating > 5) throw new Error('Rating must be between 1 and 5');

    // Check verified purchase
    let isVerified = false;
    if (dto.order_id) {
      const { data: orderItem } = await supabase
        .from('marketplace_order_items')
        .select('id')
        .eq('order_id', dto.order_id)
        .eq('product_id', dto.product_id)
        .single();
      if (orderItem) isVerified = true;
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: dto.product_id,
        customer_id: customerId,
        order_id: dto.order_id,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        images: dto.images || [],
        is_verified_purchase: isVerified,
      })
      .select().single();
    if (error) throw new Error(error.message);

    // Update product avg rating
    await this.updateProductRating(dto.product_id);

    return data;
  },

  async update(customerId: string, reviewId: string, dto: {
    rating?: number; title?: string; comment?: string; images?: string[];
  }) {
    if (dto.rating && (dto.rating < 1 || dto.rating > 5)) throw new Error('Rating must be between 1 and 5');

    const { data, error } = await supabase
      .from('reviews')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .eq('customer_id', customerId)
      .select().single();
    if (error) throw new Error(error.message);

    if (dto.rating && data) {
      await this.updateProductRating(data.product_id);
    }

    return data;
  },

  async delete(customerId: string, reviewId: string) {
    const { data: review } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', reviewId)
      .eq('customer_id', customerId)
      .single();

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('customer_id', customerId);
    if (error) throw new Error(error.message);

    if (review) {
      await this.updateProductRating(review.product_id);
    }

    return { deleted: true };
  },

  async updateProductRating(productId: string) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (!reviews || reviews.length === 0) {
      await supabase.from('marketplace_products')
        .update({ avg_rating: 0, total_reviews: 0, updated_at: new Date().toISOString() })
        .eq('id', productId);
      return;
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / reviews.length) * 100) / 100;

    await supabase.from('marketplace_products')
      .update({ avg_rating: avg, total_reviews: reviews.length, updated_at: new Date().toISOString() })
      .eq('id', productId);
  },
};
