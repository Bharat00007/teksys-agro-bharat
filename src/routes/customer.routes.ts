import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', customerController.register);
router.post('/login', customerController.login);

// Password Reset Routes (handled by authController for unified logic)
import { authController } from '../controllers/auth.controller';
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Protected routes (customer only)
router.get('/profile', authenticate, authorize('customer'), customerController.getProfile);
router.put('/profile', authenticate, authorize('customer'), customerController.updateProfile);

// Address management
router.get('/addresses', authenticate, authorize('customer'), customerController.getAddresses);
router.post('/addresses', authenticate, authorize('customer'), customerController.addAddress);
router.put('/addresses/:addressId', authenticate, authorize('customer'), customerController.updateAddress);
router.delete('/addresses/:addressId', authenticate, authorize('customer'), customerController.deleteAddress);

export default router;
