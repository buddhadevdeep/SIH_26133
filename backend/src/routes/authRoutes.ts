import { Router } from 'express';
import {
  sendPatientOtp,
  verifyPatientOtp,
  login,
  register,
  getCurrentUser,
  updateProfile,
  updatePatientById,
  refresh,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/patient/send-otp', sendPatientOtp);
router.post('/patient/verify-otp', verifyPatientOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.patch('/profile', authenticate, updateProfile);
router.put('/patients/:id', updatePatientById);
router.patch('/patients/:id', updatePatientById);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
