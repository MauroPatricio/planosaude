import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { 
  getInstitutions, 
  createInstitution, 
  updateInstitution, 
  getInstitutionStats, 
  getGlobalB2BStats,
  processCollectivePayment
} from '../controllers/institutionController.js';

const router = Router();

router.get('/', protect, getInstitutions);
router.post('/', protect, authorize('admin', 'manager'), createInstitution);
router.put('/:id', protect, authorize('admin', 'manager'), updateInstitution);
router.get('/stats/global', protect, getGlobalB2BStats);
router.get('/:id/stats', protect, getInstitutionStats);
router.post('/:id/pay-collective', protect, authorize('admin', 'manager'), processCollectivePayment);

export default router;
