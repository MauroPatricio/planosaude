import { type Request, type Response } from 'express';
import HealthPlan from '../models/HealthPlan.js';
import logger from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const plans = await HealthPlan.find({ tenant: req.tenantId, isActive: true }).sort({ name: 1 });
    res.json(plans);
  } catch (error: any) {
    logger.error(`Get Plans Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllPlans = async (req: AuthRequest, res: Response) => {
  try {
    const plans = await HealthPlan.find({ tenant: req.tenantId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error: any) {
    logger.error(`Get All Plans Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { name, operator, type, category, priceMonthly, benefits } = req.body;

    const plan = await HealthPlan.create({
      name,
      operator,
      type,
      category,
      priceMonthly,
      benefits,
      tenant: req.tenantId
    });

    res.status(201).json(plan);
  } catch (error: any) {
    logger.error(`Create Plan Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao criar plano de saúde', error: error.message });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await HealthPlan.findOneAndUpdate(
      { _id: id, tenant: req.tenantId },
      req.body,
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }

    res.json(plan);
  } catch (error: any) {
    logger.error(`Update Plan Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await HealthPlan.findOneAndDelete({ _id: id, tenant: req.tenantId });

    if (!plan) {
      return res.status(404).json({ message: 'Plano não encontrado.' });
    }

    res.json({ message: 'Plano removido com sucesso.' });
  } catch (error: any) {
    logger.error(`Delete Plan Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};
