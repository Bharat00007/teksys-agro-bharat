import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', categoryController.getAll);
router.get('/slug/:slug', categoryController.getBySlug);
router.get('/:id', categoryController.getById);

// Admin routes
router.post('/', authenticate, authorize('admin'), categoryController.create);
router.put('/:id', authenticate, authorize('admin'), categoryController.update);
router.delete('/:id', authenticate, authorize('admin'), categoryController.delete);

export default router;
