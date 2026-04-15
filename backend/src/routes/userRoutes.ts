import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import { getUsers, createUser, updateUserRole, deleteUser } from '../controllers/userController.js';
import { authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', protect, getUsers);

// Register a push token for the current user
router.post('/push-token', protect, async (req: any, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required' });

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.pushTokens) user.pushTokens = [];
    if (!user.pushTokens.includes(token)) {
      user.pushTokens.push(token);
      await user.save();
    }
    res.json({ message: 'Push token registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Equipa / Membros Management
// Apenas admins podem gerir utilizadores completos (adicionar, remover, alterar role)
// O protect já assegura que `req.tenantId` está preenchido
// Approvals Management
import { getPendingClients, approveClient, rejectClient, requestCorrection } from '../controllers/userApprovalController.js';

router.get('/admin/approvals/clients', protect, authorize('admin', 'manager'), getPendingClients);
router.put('/admin/approvals/clients/:id/approve', protect, authorize('admin', 'manager'), approveClient);
router.put('/admin/approvals/clients/:id/reject', protect, authorize('admin', 'manager'), rejectClient);
router.put('/admin/approvals/clients/:id/correction', protect, authorize('admin', 'manager'), requestCorrection);

export default router;
