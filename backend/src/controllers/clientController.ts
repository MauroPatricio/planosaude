import { type Request, type Response } from 'express';
import Client from '../models/Client.js';
import logger from '../utils/logger.js';

export const createClient = async (req: any, res: Response) => {
  try {
    const { name, email, phone, documentId, address, status } = req.body;
    const client = await Client.create({
      name,
      email,
      phone,
      documentId,
      address,
      status,
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
    const clients = await Client.find(query).sort({ createdAt: -1 });
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
    const client = await Client.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error: any) {
    logger.error(`Update Client Error: ${error}`);
    res.status(500).json({ message: 'Error updating client' });
  }
};
