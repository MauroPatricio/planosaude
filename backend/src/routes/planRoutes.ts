import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { getPlans, getPlanById, getAllPlans, createPlan, updatePlan, deletePlan } from '../controllers/planController.js';

const router = Router();

router.get('/', protect, getPlans);
router.get('/all', protect, authorize('admin', 'manager'), getAllPlans);
router.get('/:id', protect, getPlanById);
router.post('/', protect, authorize('admin', 'manager'), createPlan);
router.put('/:id', protect, authorize('admin', 'manager'), updatePlan);
router.delete('/:id', protect, authorize('admin', 'manager'), deletePlan);

export default router;
