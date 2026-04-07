import express from 'express';
import { 
  getInvoices, 
  submitPaymentProof, 
  validatePayment, 
  generateMonthlyInvoices,
  createInvoice,
  getClientPaymentStatus,
  simulateMpesaPayment
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/summary-b2b', protect, authorize('admin', 'manager', 'broker'), getClientPaymentStatus);
router.get('/', protect, getInvoices);
router.post('/', protect, authorize('admin', 'manager'), createInvoice);
router.patch('/:id/proof', protect, uploadMiddleware.single('proof'), submitPaymentProof);
router.post('/:id/simulate-mpesa', protect, simulateMpesaPayment);
router.put('/:id/validate', protect, authorize('admin', 'manager', 'broker'), validatePayment);
router.post('/generate-monthly', protect, authorize('admin', 'manager'), generateMonthlyInvoices);

export default router;
