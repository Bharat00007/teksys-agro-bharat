import { Router } from 'express';
import { productRequestController } from '../controllers/product-request.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', authenticate, authorize('customer'), productRequestController.create);
router.get('/', authenticate, authorize('customer'), productRequestController.getAll);
router.get('/:id', authenticate, authorize('customer'), productRequestController.getById);
router.put('/:id', authenticate, authorize('customer'), productRequestController.update);
router.post('/:id/cancel', authenticate, authorize('customer'), productRequestController.cancel);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), productRequestController.getAllAdmin);
router.get('/admin/:id', authenticate, authorize('admin'), productRequestController.getByIdAdmin);
router.put('/admin/:id/status', authenticate, authorize('admin'), productRequestController.updateStatus);
router.post('/admin/check-inventory', authenticate, authorize('admin'), productRequestController.checkInventory);

export default router;
