import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();

import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Teksys Agro API is running', version: '2.0' });
});

try {
  const authRoutes = require('./routes/auth.routes').default;
  const farmerRoutes = require('./routes/farmer.routes').default;
  const agentRoutes = require('./routes/agent.routes').default;
  const adminRoutes = require('./routes/admin.routes').default;
  const billRoutes = require('./routes/bill.routes').default;
  const foodunitRoutes = require('./routes/foodunit.routes').default;

  app.use('/api/auth', authRoutes);
  app.use('/api/farmer', farmerRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/bill', billRoutes);
  app.use('/api/foodunit', foodunitRoutes);

  // Admin Inventory Management
  const inventoryRoutes = require('./routes/inventory.routes').default;
  app.use('/api/admin/inventory', inventoryRoutes);

  // Marketplace routes (Phase 2)
  const customerRoutes = require('./routes/customer.routes').default;
  const categoryRoutes = require('./routes/category.routes').default;
  const productRoutes = require('./routes/product.routes').default;
  const cartRoutes = require('./routes/cart.routes').default;
  const wishlistRoutes = require('./routes/wishlist.routes').default;
  const orderRoutes = require('./routes/order.routes').default;
  const reviewRoutes = require('./routes/review.routes').default;
  const couponRoutes = require('./routes/coupon.routes').default;
  const notificationRoutes = require('./routes/notification.routes').default;
  const productRequestRoutes = require('./routes/product-request.routes').default;

  app.use('/api/marketplace/customer', customerRoutes);
  app.use('/api/marketplace/categories', categoryRoutes);
  app.use('/api/marketplace/products', productRoutes);
  app.use('/api/marketplace/cart', cartRoutes);
  app.use('/api/marketplace/wishlist', wishlistRoutes);
  app.use('/api/marketplace/orders', orderRoutes);
  app.use('/api/marketplace/reviews', reviewRoutes);
  app.use('/api/marketplace/coupons', couponRoutes);
  app.use('/api/marketplace/notifications', notificationRoutes);
  app.use('/api/marketplace/product-requests', productRequestRoutes);

  console.log('✅ All routes loaded (Logistics + Marketplace)');
} catch (err) {
  console.error('Route loading error:', err);
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Teksys Agro API v2.0 running on port ${PORT}`);
});
