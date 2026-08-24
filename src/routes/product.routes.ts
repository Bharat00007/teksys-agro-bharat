import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { reviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', productController.getAll);
router.get('/featured', productController.getFeatured);
router.get('/trending', productController.getTrending);
router.get('/best-sellers', productController.getBestSellers);
router.get('/recently-added', productController.getRecentlyAdded);
router.get('/search/suggestions', productController.searchSuggestions);
router.get('/:id', productController.getById);
router.get('/:id/similar', productController.getSimilar);
router.get('/:productId/reviews', reviewController.getProductReviews);

// Admin routes
router.post('/', authenticate, authorize('admin'), productController.create);
router.put('/:id', authenticate, authorize('admin'), productController.update);
router.delete('/:id', authenticate, authorize('admin'), productController.delete);
router.post('/:id/images', authenticate, authorize('admin'), productController.addImage);
router.delete('/:id/images/:imageId', authenticate, authorize('admin'), productController.deleteImage);

export default router;
