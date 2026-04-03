import express from 'express';
import { createSale, getSales, approveSale } from '../controllers/saleController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSale)
  .get(protect, getSales);

router.route('/:id/approve')
  .post(protect, approveSale);

export default router;
