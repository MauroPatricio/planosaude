import { type Request, type Response } from 'express';
import User from '../models/User.js';
import Client from '../models/Client.js';
import logger from '../utils/logger.js';
import { sendNotification } from './notificationController.js';
import { sendEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

/**
 * GET /api/admin/approvals/clients
 * Returns list of clients pending validation
 */
export const getPendingClients = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = { 
      tenant: req.tenantId,
      role: 'client'
    };

    if (status === 'history') {
      query.status = { $in: ['active', 'rejected'] };
    } else if (status === 'correction') {
      query.status = 'pending_correction';
    } else {
      query.status = 'pending';
    }

    const users = await User.find(query)
      .populate({
        path: 'clientId',
        populate: { path: 'institution', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error: any) {
    logger.error(`Get Pending Clients Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao carregar clientes pendentes' });
  }
};

/**
 * PUT /api/admin/approvals/clients/:id/approve
 */
export const approveClient = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, tenant: req.tenantId }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    user.status = 'active';
    await user.save({ session });

    if (user.clientId) {
      await Client.findByIdAndUpdate(
        user.clientId, 
        { status: 'active', rejectionReason: '' },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Send Notification
    await sendNotification({
      tenantId: req.tenantId as string,
      recipientId: user._id.toString(),
      type: 'success',
      title: 'Conta Aprovada ✅',
      message: 'A sua conta foi aprovada com sucesso. Já pode aceder a todas as funcionalidades do PlanoSaude360.',
      link: '/home'
    });

    // Send Email
    await sendEmail(
      user.email,
      'Sua conta PlanoSaude360 foi aprovada!',
      `Olá ${user.name},\n\nParabéns! Sua conta foi aprovada com sucesso.\nJá pode aceder ao nosso portal e aplicação móvel.\n\nEquipa PlanoSaude360`
    );

    res.json({ message: 'Cliente aprovado com sucesso' });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Approve Client Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao aprovar cliente' });
  }
};

/**
 * PUT /api/admin/approvals/clients/:id/reject
 */
export const rejectClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findOne({ _id: id, tenant: req.tenantId });
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    user.status = 'rejected';
    await user.save();

    if (user.clientId) {
      await Client.findByIdAndUpdate(user.clientId, { 
        status: 'rejected', 
        rejectionReason: reason 
      });
    }

    // Send Notification
    await sendNotification({
      tenantId: req.tenantId as string,
      recipientId: user._id.toString(),
      type: 'error',
      title: 'Conta Rejeitada ❌',
      message: `A sua solicitação foi rejeitada. Motivo: ${reason}`,
      link: '/profile'
    });

    res.json({ message: 'Cliente rejeitado com sucesso' });
  } catch (error: any) {
    logger.error(`Reject Client Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao rejeitar cliente' });
  }
};

/**
 * PUT /api/admin/approvals/clients/:id/correction
 */
export const requestCorrection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const user = await User.findOne({ _id: id, tenant: req.tenantId });
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    user.status = 'pending_correction';
    await user.save();

    if (user.clientId) {
      await Client.findByIdAndUpdate(user.clientId, { 
        status: 'pending_correction', 
        rejectionReason: message 
      });
    }

    // Send Notification
    await sendNotification({
      tenantId: req.tenantId as string,
      recipientId: user._id.toString(),
      type: 'warning',
      title: 'Correção Necessária ⚠️',
      message: `Precisamos que corrija alguns dados: ${message}`,
      link: '/register-client'
    });

    res.json({ message: 'Solicitação de correção enviada' });
  } catch (error: any) {
    logger.error(`Correction Request Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao solicitar correção' });
  }
};
