import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getMembers, createMember, updateMember, deleteMember } from '../controllers/memberController.js';

const router = Router();

router.get('/', protect, getMembers);
router.post('/', protect, createMember);
router.put('/:id', protect, updateMember);
router.delete('/:id', protect, deleteMember);

export default router;
