import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { 
  submitPlanRequest, 
  getPlanRequests, 
  updatePlanRequestStatus, 
  getMyRequests 
} from '../controllers/planRequestController.js';

const router = Router();

router.get('/', protect, authorize('admin', 'manager'), getPlanRequests);
router.get('/my', protect, getMyRequests);
router.post('/', protect, submitPlanRequest);
router.put('/:id/status', protect, authorize('admin', 'manager'), updatePlanRequestStatus);

export default router;
