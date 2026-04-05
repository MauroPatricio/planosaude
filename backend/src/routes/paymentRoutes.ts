import express from 'express';
import { 
  getInvoices, 
  submitPaymentProof, 
  validatePayment, 
  generateMonthlyInvoices,
  createInvoice,
  getClientPaymentStatus
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/summary-b2b', (req, res, next) => { console.log('HIT: /api/payments/summary-b2b'); next(); }, protect, authorize('admin', 'manager', 'broker'), getClientPaymentStatus);
router.get('/', protect, getInvoices);
router.post('/', protect, authorize('admin', 'manager'), createInvoice);
router.put('/:id/proof', protect, submitPaymentProof);
router.put('/:id/validate', protect, authorize('admin', 'manager', 'broker'), validatePayment);
router.post('/generate-monthly', protect, authorize('admin', 'manager'), generateMonthlyInvoices);

export default router;
