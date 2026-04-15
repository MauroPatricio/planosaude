import { type Request, type Response } from 'express';
import Institution from '../models/Institution.js';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import Tenant from '../models/Tenant.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getInstitutions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.tenantId) return res.status(401).json({ message: 'Tenant ID missing' });
    const tenantIdStr = String(req.tenantId);
    const institutions = await Institution.find({ tenant: new mongoose.Types.ObjectId(tenantIdStr as any) }).sort({ name: 1 });
    
    // Enrich with employee count
    const enriched = await Promise.all(institutions.map(async (inst) => {
      const employeeCount = await Client.countDocuments({ institution: inst._id });
      return { 
        ...inst.toObject(), 
        employeeCount 
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    logger.error(`Get Institutions Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicInstitutions = async (req: Request, res: Response) => {
  try {
    // Return institutions for the main tenant for public registration
    const defaultTenant = await Tenant.findOne();
    if (!defaultTenant) return res.json([]);
    
    const institutions = await Institution.find({ 
      tenant: defaultTenant._id,
      status: 'active' 
    }).select('name _id').sort({ name: 1 });
    
    res.json(institutions);
  } catch (error: any) {
    logger.error(`Get Public Institutions Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao carregar instituições' });
  }
};

export const createInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const institution = await Institution.create({
      ...req.body,
      tenant: req.tenantId
    });
    res.status(201).json(institution);
  } catch (error: any) {
    logger.error(`Create Institution Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao cadastrar instituição', error: error.message });
  }
};

export const updateInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const inst = await Institution.findOneAndUpdate(
      { _id: id, tenant: req.tenantId },
      req.body,
      { new: true }
    );
    if (!inst) return res.status(404).json({ message: 'Instituição não encontrada' });
    res.json(inst);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInstitutionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = new mongoose.Types.ObjectId(id as any);

    // Indicator: Employees
    const totalEmployees = await Client.countDocuments({ institution: institutionId });
    const activeClients = await Client.countDocuments({ institution: institutionId, status: 'active' });

    // Indicator: Financial (Approved Sales)
    if (!req.tenantId) return res.status(401).json({ message: 'Tenant ID missing' });
    const tenantIdStr = String(req.tenantId);
    
    const financialStats = await Sale.aggregate([
      { $match: { institution: institutionId, tenant: new mongoose.Types.ObjectId(tenantIdStr as any) } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = financialStats.find(s => s._id === 'approved')?.total || 0;
    const pending = financialStats.find(s => s._id === 'pending')?.total || 0;

    res.json({
      totalEmployees,
      activeClients,
      revenue,
      pending,
      detailedStatus: financialStats
    });
  } catch (error: any) {
    logger.error(`Institution Stats Error: ${error.message}`);
    res.status(500).json({ message: 'Error fetching institution stats' });
  }
};

export const getGlobalB2BStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.tenantId) return res.status(401).json({ message: 'Tenant ID missing' });
    const tenantIdStr = String(req.tenantId);
    const tenantId = new mongoose.Types.ObjectId(tenantIdStr as any);

    const topInstitutions = await Sale.aggregate([
      { $match: { tenant: tenantId, status: 'approved', institution: { $exists: true } } },
      {
        $group: {
          _id: '$institution',
          revenue: { $sum: '$value' },
          vendas: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'institutions',
          localField: '_id',
          foreignField: '_id',
          as: 'details'
        }
      },
      { $unwind: '$details' }
    ]);

    res.json({ topInstitutions });
  } catch (error: any) {
    res.status(500).json({ message: 'Error' });
  }
};

export const processCollectivePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Institution ID
    const institutionId = new mongoose.Types.ObjectId(id as any);

    // Update all pending sales for this institution to 'paid'
    const result = await Sale.updateMany(
      { 
        institution: institutionId, 
        tenant: new mongoose.Types.ObjectId(req.tenantId as any),
        status: 'pending'
      },
      { 
        $set: { status: 'paid' },
        $push: { notes: `Pagamento coletivo processado em ${new Date().toLocaleDateString()}` }
      }
    );

    res.json({ 
      message: 'Pagamento coletivo processado com sucesso', 
      updatedCount: result.modifiedCount 
    });
  } catch (error: any) {
    logger.error(`Collective Payment Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao processar pagamento coletivo' });
  }
};
