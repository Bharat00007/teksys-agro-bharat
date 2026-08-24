import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', authenticate, authorize('customer'), orderController.placeOrder);
router.get('/', authenticate, authorize('customer'), orderController.getOrders);
router.get('/:id', authenticate, authorize('customer'), orderController.getOrderById);
router.post('/:id/cancel', authenticate, authorize('customer'), orderController.cancelOrder);
router.post('/:id/reorder', authenticate, authorize('customer'), orderController.reorder);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), orderController.getAllOrders);
router.put('/admin/:id/status', authenticate, authorize('admin'), orderController.updateOrderStatus);

export default router;
