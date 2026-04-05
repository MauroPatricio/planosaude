import express from 'express';
import { getDashboardStats, getDashboardCharts, getDashboardActivities, getDashboardIntelligentData } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/charts', protect, getDashboardCharts);
router.get('/activities', protect, getDashboardActivities);
router.get('/intelligent', protect, getDashboardIntelligentData);

export default router;
