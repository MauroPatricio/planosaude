import { Router } from 'express';
import { exportSalesReport, getCommissions } from '../controllers/reportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/sales', protect, authorize('admin', 'manager'), exportSalesReport);
router.get('/commissions', protect, getCommissions);

export default router;
