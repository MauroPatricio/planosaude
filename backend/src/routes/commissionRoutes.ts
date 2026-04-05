import express from 'express';
import { getCommissions, markAsPaid } from '../controllers/commissionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCommissions);
router.patch('/:id/pay', markAsPaid);

export default router;
