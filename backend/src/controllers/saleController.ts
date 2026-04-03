import { type Request, type Response } from 'express';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import HealthPlan from '../models/HealthPlan.js';
import { sendPushNotification } from '../services/notificationService.js';
import logger from '../utils/logger.js';
import { getIO } from '../utils/socket.js';

export const createSale = async (req: any, res: Response) => {
  try {
    const { client: clientId, plan: planId, value, paymentMethod, contractNumber, notes } = req.body;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const sale = await Sale.create({
      client: clientId,
      plan: planId,
      broker: req.user._id,
      tenant: req.tenantId,
      value,
      paymentMethod,
      contractNumber,
      notes,
      status: 'pending'
    });

    // Emit real-time update
    const io = getIO();
    io.emit('sale:created', sale);

    res.status(201).json(sale);
  } catch (error: any) {
    logger.error(`Create Sale Error: ${error}`);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

export const getSales = async (req: any, res: Response) => {
  try {
    let query: any = { tenant: req.tenantId };
    
    // If broker, only show their own sales. If admin/manager, show all in tenant
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }

    const sales = await Sale.find(query)
      .populate('client')
      .populate('plan')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error: any) {
    logger.error(`Get Sales Error: ${error}`);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};

export const approveSale = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    sale.status = 'approved';
    await sale.save(); // This triggers the commission generation post-save hook

    // Trigger Push Notification to the Broker
    try {
      await sendPushNotification(
        sale.broker.toString(),
        'Venda Aprovada! 🎉',
        `A venda do cliente com ID ${sale.client} foi aprovada. Verifique as suas comissões!`
      );
    } catch (pushErr) {
      logger.error('Erro ao enviar notificação de aprovação:', pushErr);
    }

    // Emit real-time update
    const io = getIO();
    io.emit('sale:updated', sale);

    res.json(sale);
  } catch (error: any) {
    logger.error(`Approve Sale Error: ${error}`);
    res.status(500).json({ message: 'Error approving sale' });
  }
};
