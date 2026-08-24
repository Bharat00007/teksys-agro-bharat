import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/validate', authenticate, authorize('customer'), couponController.validate);
router.get('/available', authenticate, authorize('customer'), couponController.getAvailable);

// Admin routes
router.get('/', authenticate, authorize('admin'), couponController.getAll);
router.post('/', authenticate, authorize('admin'), couponController.create);
router.put('/:id', authenticate, authorize('admin'), couponController.update);
router.delete('/:id', authenticate, authorize('admin'), couponController.delete);

export default router;
