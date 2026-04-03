import { Router } from 'express';
import { exportSalesReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/sales', protect, authorize('admin', 'manager'), exportSalesReport);

export default router;
