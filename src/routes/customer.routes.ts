import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', customerController.register);
router.post('/login', customerController.login);

// Protected routes (customer only)
router.get('/profile', authenticate, authorize('customer'), customerController.getProfile);
router.put('/profile', authenticate, authorize('customer'), customerController.updateProfile);

// Address management
router.get('/addresses', authenticate, authorize('customer'), customerController.getAddresses);
router.post('/addresses', authenticate, authorize('customer'), customerController.addAddress);
router.put('/addresses/:addressId', authenticate, authorize('customer'), customerController.updateAddress);
router.delete('/addresses/:addressId', authenticate, authorize('customer'), customerController.deleteAddress);

export default router;
