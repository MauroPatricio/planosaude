import { type Request, type Response } from 'express';
import PlanRequest from '../models/PlanRequest.js';
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import logger from '../utils/logger.js';
import { sendNotification } from './notificationController.js';
import { getIO } from '../utils/socket.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const submitPlanRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { planId, clientId, requestType = 'new_subscription' } = req.body;

    // Check if there's already a pending request of the same type
    const existing = await PlanRequest.findOne({
      client: clientId || req.user.clientId,
      status: 'pending',
      requestType,
      tenant: req.tenantId
    });

    if (existing) {
      return res.status(400).json({ message: `Já possui um pedido de ${requestType === 'new_subscription' ? 'adesão' : 'cancelamento'} pendente.` });
    }

    const newRequest = await PlanRequest.create({
      tenant: req.tenantId,
      client: clientId || req.user.clientId,
      plan: planId,
      status: 'pending',
      requestType
    });

    // Notify Admins
    const admins = await User.find({ tenant: req.tenantId, role: { $in: ['admin', 'manager'] } });
    const typeLabel = requestType === 'new_subscription' ? 'Adesão a Plano' : 'Cancelamento de Plano';
    for (const admin of admins) {
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (admin._id as any).toString(),
        type: requestType === 'new_subscription' ? 'info' : 'warning',
        title: `Nova Solicitação: ${typeLabel}`,
        message: `Um cliente submeteu um pedido de ${typeLabel.toLowerCase()}.`,
        link: '/new-sales'
      });
    }

    // Emit Real-time update for Web Admin
    try {
      const io = getIO();
      io.to(`tenant:${req.tenantId}`).emit('planRequest:new', newRequest);
    } catch (socketErr) {
      logger.error('Socket emission failed for new plan request');
    }

    res.status(201).json(newRequest);
  } catch (error: any) {
    logger.error(`Submit Plan Request Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao submeter pedido de plano' });
  }
};

export const getPlanRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = { tenant: req.tenantId };
    if (status) query.status = status;

    const requests = await PlanRequest.find(query)
      .populate('client', 'name email phone institution')
      .populate('plan', 'name operator priceMonthly')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error: any) {
    logger.error(`Get Plan Requests Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao carregar solicitações' });
  }
};

export const updatePlanRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const planRequest = await PlanRequest.findOne({ _id: id, tenant: req.tenantId }).populate('plan');
    if (!planRequest) return res.status(404).json({ message: 'Solicitação não encontrada' });

    planRequest.status = status;
    if (status === 'approved') {
      planRequest.approvedAt = new Date();
      
      if (planRequest.requestType === 'cancellation') {
        // Handle Cancellation
        await Subscription.updateMany(
          { beneficiaryId: planRequest.client, status: { $ne: 'cancelled' }, tenant: req.tenantId },
          { status: 'cancelled' }
        );
        logger.info(`Subscription cancelled for client ${planRequest.client} via approved request`);
      } else {
        // Handle New Subscription (Existing Logic)
        // 1. Create Subscription
        const sub = await Subscription.create({
          tenant: req.tenantId,
          beneficiaryType: 'Client',
          beneficiaryId: planRequest.client,
          plan: planRequest.plan._id,
          priceMonthly: (planRequest.plan as any).priceMonthly,
          status: 'pending' // Pending initial payment
        });

        // 2. Generate initial Invoice
        await Invoice.create({
          tenant: req.tenantId,
          client: planRequest.client,
          subscription: sub._id,
          amount: (planRequest.plan as any).priceMonthly,
          dueDate: new Date(),
          invoiceNumber: `INV-${Date.now()}`,
          status: 'open',
          notes: 'Fatura inicial após aprovação de plano'
        });

        // 3. Create Sale (for sales tracking & commission)
        const client = await Client.findOne({ _id: planRequest.client });
        if (client) {
          await Sale.create({
            client: planRequest.client,
            plan: planRequest.plan._id,
            broker: client.broker,
            institution: client.institution,
            tenant: req.tenantId,
            value: (planRequest.plan as any).priceMonthly,
            status: 'approved',
            paymentMethod: 'm-pesa', // Default for mobile flows
            notes: 'Venda gerada automaticamente via aprovação de plano (Mobile)'
          });
        }
      }
    } else if (status === 'rejected') {
      planRequest.rejectionReason = rejectionReason;
      planRequest.rejectedAt = new Date();
    }

    await planRequest.save();

    // Emit Real-time update
    try {
      const io = getIO();
      io.to(`tenant:${req.tenantId}`).emit('planRequest:updated', planRequest);
    } catch (socketErr) {
      logger.error('Socket emission failed for plan request update');
    }

    // Notify Client
    const clientUser = await User.findOne({ clientId: planRequest.client });
    if (clientUser) {
      const typeLabel = planRequest.requestType === 'new_subscription' ? 'de adesão' : 'de cancelamento';
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (clientUser._id as any).toString(),
        type: status === 'approved' ? 'success' : 'error',
        title: status === 'approved' ? 'Pedido Aprovado' : 'Pedido Recusado',
        message: status === 'approved' 
          ? `O seu pedido ${typeLabel} foi aprovado com sucesso.` 
          : `O seu pedido ${typeLabel} foi recusado: ${rejectionReason || 'Dados insuficientes'}.`,
        link: '/portal'
      });
    }

    res.json(planRequest);
  } catch (error: any) {
    logger.error(`Update Plan Request Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao atualizar solicitação' });
  }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await PlanRequest.find({ 
      client: req.user.clientId,
      tenant: req.tenantId 
    }).populate('plan').sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    logger.error(`Get My Requests Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao carregar seus pedidos' });
  }
};
