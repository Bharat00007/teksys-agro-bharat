import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', authenticate, authorize('customer'), reviewController.create);
router.put('/:id', authenticate, authorize('customer'), reviewController.update);
router.delete('/:id', authenticate, authorize('customer'), reviewController.delete);

export default router;
