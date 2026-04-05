import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getSubscriptions, getAvailablePlans } from '../controllers/subscriptionController.js';

const router = Router();

router.get('/', protect, getSubscriptions);
router.get('/plans', protect, getAvailablePlans);

export default router;
