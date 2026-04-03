import express from 'express';
import { registerUser, registerTenant, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', protect, registerUser); // Only authenticated admins can add users to their tenant
router.post('/register-tenant', registerTenant);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

export default router;
