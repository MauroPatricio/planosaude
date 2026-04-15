import { type Request, type Response } from 'express';
import ApprovalRequest from '../models/ApprovalRequest.js';
import Member from '../models/Member.js';
import Subscription from '../models/Subscription.js';
import HealthPlan from '../models/HealthPlan.js';
import mongoose from 'mongoose';
import { sendApprovalNotification } from '../utils/emailService.js';
import logger from '../utils/logger.js';
import { sendNotification } from './notificationController.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = { tenant: req.tenantId };
    
    // If client, only show their own requests
    if (req.user.role === 'client' && req.user.clientId) {
      query.client = req.user.clientId; 
    }

    const requests = await ApprovalRequest.find(query)
      .populate('client', 'name email')
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error: any) {
    logger.error(`Get Requests Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { type, requestData, clientId } = req.body;

    const approvalRequest = await ApprovalRequest.create({
      tenant: req.tenantId,
      client: clientId || req.user.clientId,
      type,
      requestData,
      status: 'pending'
    });

    await approvalRequest.save();

    // Notify Admins/Managers of the tenant
    const admins = await User.find({ tenant: req.tenantId, role: { $in: ['admin', 'manager'] } });
    for (const admin of admins) {
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (admin._id as any).toString(),
        type: 'info',
        title: 'Novo Pedido de Aprovação',
        message: `O cliente submeteu um pedido de: ${type === 'member_add' ? 'Adição de Familiar' : 'Adesão a Plano'}.`,
        link: '/approvals'
      });
    }

    res.status(201).json(approvalRequest);
  } catch (error: any) {
    logger.error(`Create Request Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao criar solicitação', error: error.message });
  }
};

export const handleRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body; // approved or rejected

    const approvalRequest = await ApprovalRequest.findOne({ _id: id, tenant: req.tenantId });

    if (!approvalRequest) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    if (approvalRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Esta solicitação já foi processada' });
    }

    approvalRequest.status = status;
    approvalRequest.comments = comments;
    approvalRequest.handledBy = req.user._id;
    approvalRequest.processedAt = new Date();

    if (status === 'approved') {
      // APPLY THE CHANGES
      const data = approvalRequest.requestData;

      switch (approvalRequest.type) {
        case 'member_add':
          await Member.create({
            primaryClient: approvalRequest.client,
            name: data.name,
            birthDate: data.birthDate,
            relationship: data.relationship,
            documentId: data.documentId,
            status: 'active',
            tenant: approvalRequest.tenant
          });
          break;

        case 'plan_adherence':
          const plan = await HealthPlan.findById(data.planId);
          if (plan) {
            await Subscription.create({
              beneficiaryType: data.beneficiaryType || 'Client',
              beneficiaryId: data.beneficiaryId || approvalRequest.client,
              plan: data.planId,
              priceMonthly: plan.priceMonthly,
              status: 'active',
              startDate: new Date(),
              tenant: approvalRequest.tenant
            });
          }
          break;

        case 'plan_removal':
          await Subscription.findOneAndUpdate(
            { _id: data.subscriptionId, tenant: approvalRequest.tenant },
            { status: 'cancelled', endDate: new Date() }
          );
          break;
          
        case 'member_removal':
             await Member.findOneAndUpdate(
                { _id: data.memberId, tenant: approvalRequest.tenant },
                { status: 'inactive' }
             );
             break;
      }
    }

    await approvalRequest.save();

    // Send Real-time Notification to Client
    const clientUser = await User.findOne({ clientId: approvalRequest.client });
    if (clientUser) {
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (clientUser._id as any).toString(),
        type: status === 'approved' ? 'success' : 'error',
        title: `Pedido ${status === 'approved' ? 'Aprovado' : 'Rejeitado'}`,
        message: `O seu pedido de ${approvalRequest.type === 'member_add' ? 'adição de familiar' : 'adesão'} foi ${status === 'approved' ? 'aprovado' : 'rejeitado'}.`,
        link: '/portal'
      });
    }

    // Send Email notification
    if (approvalRequest.client) {
      const clientPopulated: any = await Client.findById(approvalRequest.client);
      if (clientPopulated && clientPopulated.email) {
        await sendApprovalNotification(
           clientPopulated.email, 
           clientPopulated.name, 
           status, 
           approvalRequest.type
        );
      }
    }

    res.json(approvalRequest);
  } catch (error: any) {
    logger.error(`Handle Request Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao processar solicitação', error: error.message });
  }
};
