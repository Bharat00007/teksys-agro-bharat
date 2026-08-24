import { supabase } from '../config/supabase';

export const cartService = {

  async getCart(customerId: string) {
    // Get or create cart
    let { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ customer_id: customerId })
        .select().single();
      if (error) throw new Error(error.message);
      cart = newCart;
    }

    // Get cart items with product details
    const { data: items } = await supabase
      .from('cart_items')
      .select('*, marketplace_products(id, name, slug, image_url, mrp, selling_price, discount_percent, unit, weight_value, stock_quantity, is_active)')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    const cartItems = (items || []).filter(
      (item: any) => item.marketplace_products?.is_active
    );

    // Calculate totals
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += (item.marketplace_products?.selling_price || 0) * item.quantity;
    }
    const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const deliveryCharges = subtotal >= 500 ? 0 : 40;
    const total = subtotal + gst + deliveryCharges;

    return {
      cart_id: cart.id,
      items: cartItems,
      item_count: cartItems.length,
      subtotal: Math.round(subtotal * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      delivery_charges: deliveryCharges,
      total: Math.round(total * 100) / 100,
      free_delivery_threshold: 500,
    };
  },

  async addItem(customerId: string, productId: string, quantity: number = 1) {
    // Validate product
    const { data: product } = await supabase
      .from('marketplace_products')
      .select('id, stock_quantity, max_order_qty, is_active')
      .eq('id', productId)
      .single();
    if (!product || !product.is_active) throw new Error('Product not available');
    if (product.stock_quantity < quantity) throw new Error('Insufficient stock');

    // Get cart
    let { data: cart } = await supabase
      .from('carts').select('id').eq('customer_id', customerId).single();
    if (!cart) {
      const { data: newCart } = await supabase
        .from('carts').insert({ customer_id: customerId }).select().single();
      cart = newCart;
    }

    // Check existing item
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart!.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.max_order_qty) throw new Error(`Maximum ${product.max_order_qty} allowed`);
      if (newQty > product.stock_quantity) throw new Error('Insufficient stock');

      await supabase.from('cart_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      if (quantity > product.max_order_qty) throw new Error(`Maximum ${product.max_order_qty} allowed`);
      await supabase.from('cart_items')
        .insert({ cart_id: cart!.id, product_id: productId, quantity });
    }

    return this.getCart(customerId);
  },

  async updateItemQuantity(customerId: string, productId: string, quantity: number) {
    if (quantity < 1) return this.removeItem(customerId, productId);

    const { data: product } = await supabase
      .from('marketplace_products')
      .select('stock_quantity, max_order_qty')
      .eq('id', productId).single();
    if (!product) throw new Error('Product not found');
    if (quantity > product.max_order_qty) throw new Error(`Maximum ${product.max_order_qty} allowed`);
    if (quantity > product.stock_quantity) throw new Error('Insufficient stock');

    const { data: cart } = await supabase
      .from('carts').select('id').eq('customer_id', customerId).single();
    if (!cart) throw new Error('Cart not found');

    await supabase.from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('cart_id', cart.id)
      .eq('product_id', productId);

    return this.getCart(customerId);
  },

  async removeItem(customerId: string, productId: string) {
    const { data: cart } = await supabase
      .from('carts').select('id').eq('customer_id', customerId).single();
    if (!cart) throw new Error('Cart not found');

    await supabase.from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('product_id', productId);

    return this.getCart(customerId);
  },

  async clearCart(customerId: string) {
    const { data: cart } = await supabase
      .from('carts').select('id').eq('customer_id', customerId).single();
    if (!cart) throw new Error('Cart not found');

    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    return this.getCart(customerId);
  },
};
