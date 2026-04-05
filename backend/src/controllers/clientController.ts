import { type Request, type Response } from 'express';
import Client from '../models/Client.js';
import Member from '../models/Member.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

export const createClient = async (req: any, res: Response) => {
  try {
    const { 
      name, email, phone, documentId, address, status, institution, documents,
      preferredPaymentDate, billingCycle
    } = req.body;
    const client = await Client.create({
      name,
      email,
      phone,
      documentId,
      address,
      status,
      institution: institution || undefined,
      documents: documents || undefined,
      preferredPaymentDate,
      billingCycle,
      broker: req.user._id,
      tenant: req.tenantId,
      history: [{ action: 'Creation', note: 'Cliente registado no sistema.' }]
    });

    res.status(201).json(client);
  } catch (error: any) {
    logger.error(`Create Client Error: ${error}`);
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

export const getClients = async (req: any, res: Response) => {
  try {
    let query: any = { tenant: req.tenantId };
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }
    
    if (req.query.institutionId) {
      query.institution = new mongoose.Types.ObjectId(req.query.institutionId);
    }
    
    // Convert IDs to ObjectIds for aggregation
    if (query.broker) query.broker = new mongoose.Types.ObjectId(query.broker);
    if (query.tenant) query.tenant = new mongoose.Types.ObjectId(query.tenant);

    const aggregationPipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: 'members',
          let: { clientId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toObjectId: '$primaryClient' }, '$$clientId'] },
                    { $eq: ['$status', 'active'] }
                  ]
                }
              }
            }
          ],
          as: 'members'
        }
      },
      {
        $addFields: {
          memberCount: { $size: { $ifNull: ['$members', []] } }
        }
      },
      {
        $lookup: {
          from: 'institutions',
          localField: 'institution',
          foreignField: '_id',
          as: 'institution'
        }
      },
      { $unwind: { path: '$institution', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'beneficiaryId',
          as: 'activeSubscriptions'
        }
      },
      {
        $addFields: {
          hasActiveSubscription: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$activeSubscriptions',
                    as: 'sub',
                    cond: { $in: ['$$sub.status', ['active', 'pending']] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $project: { members: 0, activeSubscriptions: 0 } }
    ];

    const clients = await Client.aggregate(aggregationPipeline);
    res.json(clients);
  } catch (error: any) {
    logger.error(`Get Clients Error: ${error}`);
    res.status(500).json({ message: 'Error fetching clients' });
  }
};

export const getClientById = async (req: any, res: Response) => {
  try {
    let query: any = { _id: req.params.id, tenant: req.tenantId };
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }
    const client = await Client.findOne(query);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error: any) {
    logger.error(`Get Client Error: ${error}`);
    res.status(500).json({ message: 'Error fetching client' });
  }
};

export const updateClient = async (req: any, res: Response) => {
  try {
    let query: any = { _id: req.params.id, tenant: req.tenantId };
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }

    const updateData = { ...req.body };
    if (updateData.institution === '') {
      updateData.institution = undefined;
    }

    const client = await Client.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error: any) {
    logger.error(`Update Client Error: ${error}`);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Este email já está registado' });
    }
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
};

export const deleteClient = async (req: any, res: Response) => {
  try {
    let query: any = { _id: req.params.id, tenant: req.tenantId };
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }
    const client = await Client.findOneAndDelete(query);
    if (!client) {
      return res.status(404).json({ message: 'Client not found or unauthorized' });
    }
    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error: any) {
    logger.error(`Delete Client Error: ${error}`);
    res.status(500).json({ message: 'Error deleting client' });
  }
};
