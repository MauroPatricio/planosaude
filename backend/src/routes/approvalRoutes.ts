import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { getRequests, createRequest, handleRequest } from '../controllers/approvalController.js';

const router = Router();

router.get('/', protect, getRequests);
router.post('/', protect, createRequest);
router.put('/:id', protect, authorize('admin', 'manager'), handleRequest);

export default router;
