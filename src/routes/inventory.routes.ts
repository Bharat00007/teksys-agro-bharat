import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/summary', inventoryController.getSummary);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/', inventoryController.getAll);
router.get('/:id', inventoryController.getById);
router.get('/:id/history', inventoryController.getHistory);
router.post('/', inventoryController.create);
router.put('/:id', inventoryController.update);
router.delete('/:id', inventoryController.delete);
router.post('/:id/adjust', inventoryController.adjustStock);
router.post('/upload-image', inventoryController.uploadImage);

export default router;
