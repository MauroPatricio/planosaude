import express from 'express';
import { 
  createSale, getSales, approveSale, deleteSale, updateSale 
} from '../controllers/saleController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.put('/:id/approve', protect, approveSale);
router.put('/:id', (req, res, next) => { console.log(`HIT: /api/sales/${req.params.id} [PUT]`); next(); }, protect, updateSale);
router.delete('/:id', protect, deleteSale);

export default router;
