import express from 'express';
import { 
  registerUser, registerTenant, registerClient, loginUser, getMe, updateProfileDocuments 
} from '../controllers/authController.js';
import { getPublicInstitutions } from '../controllers/institutionController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { registerUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/institutions-public', getPublicInstitutions);
router.post('/register', protect, registerUser); // Only authenticated admins can add users to their tenant
router.post('/register-tenant', registerTenant);
router.post('/register-client', registerUpload, registerClient);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.patch('/profile/documents', protect, registerUpload, updateProfileDocuments);

export default router;
