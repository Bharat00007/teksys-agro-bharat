import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/register/farmer', authController.registerFarmer);
router.post('/register/agent', authController.registerAgent);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

export default router;
