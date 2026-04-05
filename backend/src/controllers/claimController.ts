import { type Response } from 'express';
import Claim from '../models/Claim.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';

export const submitClaim = async (req: any, res: Response) => {
  try {
    const { type, description, amountRequested, subscriptionId, documents, clientId } = req.body;

    // Determine target client: if admin/broker and clientId provided, use it. Otherwise use current user.
    const targetClientId = (['admin', 'superAdmin', 'broker'].includes(req.user.role) && clientId) 
      ? clientId 
      : req.user._id;

    // Verify subscription belongs to the target client
    const subscription = await Subscription.findOne({ _id: subscriptionId, client: targetClientId });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscrição não encontrada ou inválida para este cliente' });
    }

    const claim = await Claim.create({
      client: targetClientId,
      subscription: subscriptionId,
      type,
      description,
      amountRequested,
      documents: documents || [],
      tenant: req.tenantId,
      status: 'pending'
    });

    res.status(201).json(claim);
  } catch (error: any) {
    logger.error(`Submit Claim Error: ${error}`);
    res.status(500).json({ message: 'Erro ao submeter sinistro' });
  }
};

export const getClaims = async (req: any, res: Response) => {
  try {
    const query: any = { tenant: req.tenantId };
    
    if (req.user.role === 'client') {
      query.client = req.user._id;
    } else if (req.user.role === 'broker') {
      // Brokers might see claims of their clients if needed
      // For now, let's keep it restricted to admins/clients unless decided otherwise
    }

    const claims = await Claim.find(query)
      .populate('client', 'name email phone')
      .populate('subscription')
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error: any) {
    logger.error(`Get Claims Error: ${error}`);
    res.status(500).json({ message: 'Erro ao listar sinistros' });
  }
};

export const updateClaimStatus = async (req: any, res: Response) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { status, adminNotes } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: 'Sinistro não encontrado' });
    }

    claim.status = status;
    claim.adminNotes = adminNotes;
    await claim.save();

    res.json(claim);
  } catch (error: any) {
    logger.error(`Update Claim Status Error: ${error}`);
    res.status(500).json({ message: 'Erro ao atualizar sinistro' });
  }
};
