import { supabase } from '../config/supabase';
import { notificationService } from './notification.service';

export const inventoryService = {

  // ── Dashboard Summary ────────────────────────────────────────
  async getSummary() {
    const { data: products, error } = await supabase
      .from('marketplace_products')
      .select('stock_quantity, reserved_quantity, min_stock_level, purchase_price, selling_price, expiry_date, is_active, warehouse_name');
    if (error) throw new Error(error.message);

    const active = (products || []).filter((p: any) => p.is_active);
    const totalProducts = active.length;
    const totalStock = active.reduce((s: number, p: any) => s + (p.stock_quantity || 0), 0);
    const lowStock = active.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5)).length;
    const outOfStock = active.filter((p: any) => (p.stock_quantity || 0) === 0).length;
    const totalValue = active.reduce((s: number, p: any) => s + ((p.selling_price || 0) * (p.stock_quantity || 0)), 0);

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = active.filter((p: any) =>
      p.expiry_date && new Date(p.expiry_date) <= thirtyDays && new Date(p.expiry_date) >= now
    ).length;

    const warehouses = new Set(active.map((p: any) => p.warehouse_name).filter(Boolean));

    return {
      total_products: totalProducts,
      total_stock: totalStock,
      low_stock: lowStock,
      out_of_stock: outOfStock,
      total_value: Math.round(totalValue * 100) / 100,
      expiring_soon: expiringSoon,
      active_warehouses: warehouses.size,
    };
  },

  // ── List All Inventory ───────────────────────────────────────
  async getAll(query: {
    page?: number; limit?: number; search?: string;
    category_id?: string; status?: string; warehouse?: string;
    sort_by?: string; sort_order?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let q = supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)', { count: 'exact' })
      .eq('is_active', true);

    if (query.search) {
      q = q.or(`name.ilike.%${query.search}%,sku.ilike.%${query.search}%,batch_number.ilike.%${query.search}%`);
    }
    if (query.category_id) q = q.eq('category_id', query.category_id);
    if (query.warehouse) q = q.eq('warehouse_name', query.warehouse);

    // Status filter
    if (query.status === 'low_stock') {
      q = q.gt('stock_quantity', 0).lte('stock_quantity', 5); // will be compared with min_stock_level in post-processing if needed
    } else if (query.status === 'out_of_stock') {
      q = q.eq('stock_quantity', 0);
    } else if (query.status === 'in_stock') {
      q = q.gt('stock_quantity', 5);
    }

    const sortField = query.sort_by || 'updated_at';
    const ascending = query.sort_order === 'asc';
    q = q.order(sortField, { ascending });
    q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
      items: data || [],
      pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
    };
  },

  // ── Get Single Item ──────────────────────────────────────────
  async getById(id: string) {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_categories(id, name, slug)')
      .eq('id', id)
      .single();
    if (error) throw new Error('Product not found');
    return data;
  },

  // ── Create Inventory Item ────────────────────────────────────
  async create(dto: any, adminId: string) {
    // Generate slug from name
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    const insertData: any = {
      name: dto.name,
      slug,
      category_id: dto.category_id,
      description: dto.description || null,
      short_description: dto.short_description || null,
      mrp: dto.selling_price || 0,
      selling_price: dto.selling_price || 0,
      purchase_price: dto.purchase_price || 0,
      unit: dto.unit || 'kg',
      weight_value: dto.weight_value || 1,
      stock_quantity: dto.stock_quantity || 0,
      min_stock_level: dto.min_stock_level || 5,
      min_order_qty: dto.min_order_qty || 1,
      max_order_qty: dto.max_order_qty || 100,
      sku: dto.sku || null,
      batch_number: dto.batch_number || null,
      expiry_date: dto.expiry_date || null,
      manufacturing_date: dto.manufacturing_date || null,
      supplier_name: dto.supplier_name || null,
      warehouse_name: dto.warehouse_name || 'Main Warehouse',
      warehouse_location: dto.warehouse_location || null,
      inventory_notes: dto.inventory_notes || null,
      image_url: dto.image_url || null,
      is_active: true,
      reserved_quantity: 0,
    };

    const { data, error } = await supabase
      .from('marketplace_products')
      .insert(insertData)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Log initial stock transaction
    if (data.stock_quantity > 0) {
      await this.logTransaction(data.id, {
        action: 'initial_stock',
        previous_quantity: 0,
        quantity_change: data.stock_quantity,
        new_quantity: data.stock_quantity,
        admin_id: adminId,
        notes: 'Initial inventory stock',
      });
    }

    return data;
  },

  // ── Update Inventory Item ────────────────────────────────────
  async update(id: string, dto: any, adminId: string) {
    // Get current product for comparison
    const { data: current } = await supabase
      .from('marketplace_products')
      .select('stock_quantity')
      .eq('id', id)
      .single();
    if (!current) throw new Error('Product not found');

    const updateData: any = { ...dto, updated_at: new Date().toISOString() };
    // Keep mrp in sync with selling_price if selling_price is updated
    if (dto.selling_price !== undefined) {
      updateData.mrp = dto.selling_price;
    }

    const { data, error } = await supabase
      .from('marketplace_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Log stock change if quantity was updated
    if (dto.stock_quantity !== undefined && dto.stock_quantity !== current.stock_quantity) {
      await this.logTransaction(id, {
        action: 'stock_updated',
        previous_quantity: current.stock_quantity,
        quantity_change: dto.stock_quantity - current.stock_quantity,
        new_quantity: dto.stock_quantity,
        admin_id: adminId,
        notes: dto.inventory_notes || 'Stock updated via edit',
      });

      // Check pending requests after stock increase
      if (dto.stock_quantity > current.stock_quantity) {
        await this.checkPendingRequests(id);
      }
    }

    return data;
  },

  // ── Delete Inventory Item ────────────────────────────────────
  async delete(id: string, adminId: string) {
    // Check for pending orders
    const { data: pendingOrders } = await supabase
      .from('marketplace_order_items')
      .select('id, order_id, marketplace_orders!inner(status)')
      .eq('product_id', id)
      .in('marketplace_orders.status', ['confirmed', 'packed', 'shipped', 'out_for_delivery']);

    if (pendingOrders && pendingOrders.length > 0) {
      throw new Error(`Cannot delete: ${pendingOrders.length} pending order(s) exist for this product.`);
    }

    // Check for active product requests
    const { data: activeRequests } = await supabase
      .from('product_requests')
      .select('id')
      .eq('product_id', id)
      .in('status', ['pending', 'under_review', 'accepted']);

    if (activeRequests && activeRequests.length > 0) {
      throw new Error(`Cannot delete: ${activeRequests.length} active customer request(s) exist for this product.`);
    }

    // Soft delete
    const { error } = await supabase
      .from('marketplace_products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);

    return { deleted: true };
  },

  // ── Adjust Stock ─────────────────────────────────────────────
  async adjustStock(id: string, dto: {
    action: 'increase' | 'reduce' | 'reserve' | 'release';
    quantity: number;
    notes?: string;
  }, adminId: string) {
    if (dto.quantity <= 0) throw new Error('Quantity must be greater than 0');

    const { data: product } = await supabase
      .from('marketplace_products')
      .select('stock_quantity, reserved_quantity, name')
      .eq('id', id)
      .single();
    if (!product) throw new Error('Product not found');

    let newStock = product.stock_quantity;
    let newReserved = product.reserved_quantity || 0;
    let action: string;

    switch (dto.action) {
      case 'increase':
        newStock += dto.quantity;
        action = 'stock_added';
        break;
      case 'reduce':
        if (product.stock_quantity < dto.quantity) throw new Error('Insufficient stock');
        newStock -= dto.quantity;
        action = 'stock_removed';
        break;
      case 'reserve':
        if (product.stock_quantity - (product.reserved_quantity || 0) < dto.quantity)
          throw new Error('Not enough available stock to reserve');
        newReserved += dto.quantity;
        action = 'reserved';
        break;
      case 'release':
        if ((product.reserved_quantity || 0) < dto.quantity) throw new Error('Cannot release more than reserved');
        newReserved -= dto.quantity;
        action = 'released';
        break;
      default:
        throw new Error('Invalid action');
    }

    const updateData: any = {
      stock_quantity: newStock,
      reserved_quantity: newReserved,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('marketplace_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Log transaction
    await this.logTransaction(id, {
      action,
      previous_quantity: product.stock_quantity,
      quantity_change: dto.action === 'reduce' ? -dto.quantity : dto.quantity,
      new_quantity: newStock,
      admin_id: adminId,
      notes: dto.notes || `Stock ${dto.action}d`,
    });

    // Check for pending requests if stock was increased
    if (dto.action === 'increase') {
      await this.checkPendingRequests(id);
    }

    // Check for low stock alert
    if (newStock > 0 && newStock <= (data.min_stock_level || 5)) {
      try {
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        if (admins) {
          for (const admin of admins) {
            await notificationService.create(admin.id, {
              type: 'general',
              title: 'Low Stock Alert',
              body: `${product.name} is running low (${newStock} remaining)`,
              data: { product_id: id },
            });
          }
        }
      } catch { /* non-critical */ }
    }

    return data;
  },

  // ── Get Transaction History ──────────────────────────────────
  async getHistory(productId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('inventory_transactions')
      .select('*, users:admin_id(name)', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    return {
      transactions: data || [],
      pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
    };
  },

  // ── Low Stock Items ──────────────────────────────────────────
  async getLowStock() {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('id, name, stock_quantity, min_stock_level, unit, warehouse_name, image_url')
      .eq('is_active', true)
      .lte('stock_quantity', 5) // rough filter; post-filter with min_stock_level
      .order('stock_quantity', { ascending: true });
    if (error) throw new Error(error.message);

    // Filter items where stock <= min_stock_level
    const filtered = (data || []).filter((p: any) => p.stock_quantity <= (p.min_stock_level || 5));
    return filtered;
  },

  // ── Log Transaction ──────────────────────────────────────────
  async logTransaction(productId: string, entry: {
    action: string;
    previous_quantity: number;
    quantity_change: number;
    new_quantity: number;
    admin_id?: string;
    notes?: string;
  }) {
    const { error } = await supabase
      .from('inventory_transactions')
      .insert({
        product_id: productId,
        ...entry,
      });
    if (error) console.error('Failed to log inventory transaction:', error.message);
  },

  // ── Check Pending Customer Requests ──────────────────────────
  async checkPendingRequests(productId: string) {
    try {
      const { data: product } = await supabase
        .from('marketplace_products')
        .select('stock_quantity, name, unit')
        .eq('id', productId)
        .single();
      if (!product || product.stock_quantity <= 0) return;

      const { data: requests } = await supabase
        .from('product_requests')
        .select('id, customer_id, requested_quantity, requested_product_name, unit')
        .eq('product_id', productId)
        .in('status', ['pending', 'under_review', 'accepted']);

      if (!requests || requests.length === 0) return;

      for (const req of requests) {
        if (product.stock_quantity >= req.requested_quantity) {
          // Update request status to ready_for_purchase
          await supabase
            .from('product_requests')
            .update({
              status: 'ready_for_purchase',
              available_quantity: product.stock_quantity,
              remaining_quantity: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', req.id);

          // Notify customer
          try {
            await notificationService.create(req.customer_id, {
              type: 'general',
              title: 'Stock Available!',
              body: `${req.requested_quantity} ${req.unit} of ${req.requested_product_name} is now available for purchase!`,
              data: { request_id: req.id, status: 'ready_for_purchase' },
            });
          } catch { }

          // Notify admins
          try {
            const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
            if (admins) {
              for (const admin of admins) {
                await notificationService.create(admin.id, {
                  type: 'general',
                  title: 'Request Can Be Fulfilled',
                  body: `Stock is now available for request: ${req.requested_quantity} ${req.unit} of ${req.requested_product_name}`,
                  data: { request_id: req.id, product_id: productId },
                });
              }
            }
          } catch { }
        }
      }
    } catch { /* non-critical */ }
  },

  // ── Upload Image to Supabase Storage ─────────────────────────
  async uploadImage(dto: { base64: string; fileName?: string; contentType?: string }) {
    if (!dto.base64) throw new Error('No image data provided');

    const contentType = dto.contentType || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = dto.fileName || `inventory_${Date.now()}.${ext}`;
    const filePath = `inventory/${fileName}`;

    // Decode base64 to buffer
    const buffer = Buffer.from(dto.base64, 'base64');

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === 'product-images');
    if (!bucketExists) {
      await supabase.storage.createBucket('product-images', { public: true });
    }

    // Upload
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  },
};
