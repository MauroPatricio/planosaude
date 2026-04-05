import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { getLeads, createLead, updateLead, deleteLead, convertLead } from '../controllers/leadController.js';

const router = Router();

router.get('/', protect, getLeads);
router.post('/', protect, createLead);
router.put('/:id', protect, updateLead);
router.delete('/:id', protect, deleteLead);
router.post('/:id/convert', protect, convertLead);

export default router;
