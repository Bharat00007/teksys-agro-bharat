import { Router } from 'express';
import { wishlistController } from '../controllers/wishlist.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('customer'));

router.get('/', wishlistController.getAll);
router.post('/', wishlistController.add);
router.get('/check/:productId', wishlistController.check);
router.delete('/:productId', wishlistController.remove);
router.post('/:productId/move-to-cart', wishlistController.moveToCart);

export default router;
