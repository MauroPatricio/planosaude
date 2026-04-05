import { type Request, type Response } from 'express';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import logger from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = { tenant: req.tenantId };
    
    // If broker, only show their own leads
    if (req.user.role === 'broker') {
      query.brokerId = req.user._id;
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error: any) {
    logger.error(`Get Leads Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, source, notes } = req.body;

    const lead = await Lead.create({
      name,
      email,
      phone,
      source: source || 'direct',
      notes,
      brokerId: req.user._id,
      tenant: req.tenantId,
      status: 'new'
    });

    res.status(201).json(lead);
  } catch (error: any) {
    logger.error(`Create Lead Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao criar lead', error: error.message });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findOneAndUpdate(
      { _id: id, tenant: req.tenantId },
      req.body,
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead não encontrado.' });
    }

    res.json(lead);
  } catch (error: any) {
    logger.error(`Update Lead Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const convertLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, tenant: req.tenantId });

    if (!lead) {
      return res.status(404).json({ message: 'Lead não encontrado.' });
    }

    if (lead.status === 'converted') {
      return res.status(400).json({ message: 'Este lead já foi convertido.' });
    }

    // Create a new client from lead data
    // Note: Client requires documentId, so we use a placeholder if not provided in conversion request
    const client = await Client.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      documentId: req.body.documentId || 'PENDENTE',
      address: req.body.address || '',
      status: 'active',
      broker: lead.brokerId || req.user._id,
      tenant: lead.tenant,
      history: [{
        action: 'Conversão de Lead',
        note: `Convertido a partir do lead ID: ${lead._id}`
      }]
    });

    // Update lead status
    lead.status = 'converted';
    await lead.save();

    res.status(201).json({ client, lead });
  } catch (error: any) {
    logger.error(`Convert Lead Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao converter lead em cliente', error: error.message });
  }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findOneAndDelete({ _id: id, tenant: req.tenantId });

    if (!lead) {
      return res.status(404).json({ message: 'Lead não encontrado.' });
    }

    res.json({ message: 'Lead removido com sucesso.' });
  } catch (error: any) {
    logger.error(`Delete Lead Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};
