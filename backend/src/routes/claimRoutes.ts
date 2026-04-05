import express from 'express';
import { submitClaim, getClaims, updateClaimStatus } from '../controllers/claimController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', submitClaim);
router.get('/', getClaims);
router.patch('/:id/status', authorize('admin', 'superAdmin'), updateClaimStatus);

export default router;
