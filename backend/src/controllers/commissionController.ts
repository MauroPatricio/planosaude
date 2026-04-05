import { type Request, type Response } from 'express';
import Commission from '../models/Commission.js';
import logger from '../utils/logger.js';

export const getCommissions = async (req: any, res: Response) => {
  try {
    const query: any = { tenant: req.tenantId };
    
    // Brokers only see their own commissions
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }

    const commissions = await Commission.find(query)
      .populate('sale')
      .populate('broker', 'name email')
      .sort({ createdAt: -1 });

    res.json(commissions);
  } catch (error: any) {
    logger.error(`Get Commissions Error: ${error}`);
    res.status(500).json({ message: 'Error fetching commissions' });
  }
};

export const markAsPaid = async (req: any, res: Response) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ message: 'Comissão não encontrada' });
    }

    commission.status = 'paid';
    commission.paidAt = new Date();
    await commission.save();

    res.json(commission);
  } catch (error: any) {
    logger.error(`Update Commission Error: ${error}`);
    res.status(500).json({ message: 'Error updating commission' });
  }
};
