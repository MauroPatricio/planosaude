import { type Request, type Response } from 'express';
import Subscription from '../models/Subscription.js';
import HealthPlan from '../models/HealthPlan.js';
import logger from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { beneficiaryId } = req.query;
    const query: any = { 
      tenant: req.tenantId, 
      beneficiaryId: beneficiaryId || req.user.clientId 
    };

    const subscriptions = await Subscription.find(query)
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error: any) {
    logger.error(`Get Subscriptions Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAvailablePlans = async (req: AuthRequest, res: Response) => {
    try {
        const plans = await HealthPlan.find({ tenant: req.tenantId, isActive: true });
        res.json(plans);
    } catch (error: any) {
        res.status(500).json({ message: 'Error' });
    }
};
