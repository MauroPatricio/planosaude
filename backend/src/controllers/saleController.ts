import { type Request, type Response } from 'express';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import HealthPlan from '../models/HealthPlan.js';
import Commission from '../models/Commission.js';
import { sendPushNotification } from '../services/notificationService.js';
import logger from '../utils/logger.js';
import { getIO } from '../utils/socket.js';
import Subscription from '../models/Subscription.js';
import Member from '../models/Member.js';
import Invoice from '../models/Invoice.js';

export const createSale = async (req: any, res: Response) => {
  try {
    const { 
      client: clientId, plan: planId, value, paymentMethod, 
      contractNumber, policyNumber, notes 
    } = req.body;
    
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
      policyNumber,
      beneficiaries: req.body.beneficiaries || [{ kind: 'Client', person: clientId }],
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
      .populate({
        path: 'beneficiaries.person'
      })
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
    await sale.save();

    // Generate Commission
    try {
      const plan = await HealthPlan.findById(sale.plan);
      if (plan) {
        let commissionAmount = 0;
        if (plan.commissionFixed) {
          commissionAmount = plan.commissionFixed;
        } else if (plan.commissionRate) {
          commissionAmount = (sale.value * plan.commissionRate) / 100;
        }

        if (commissionAmount > 0) {
          await Commission.create({
            sale: sale._id,
            broker: sale.broker,
            tenant: sale.tenant,
            amount: commissionAmount,
            status: 'pending'
          });
          logger.info(`Commission created: ${commissionAmount} for sale ${sale._id}`);
        }
      }
    } catch (commErr) {
      logger.error('Error generating commission:', commErr);
    }

    // Create Subscriptions automatically upon approval for ALL beneficiaries
    try {
      const beneficiaries = sale.beneficiaries && sale.beneficiaries.length > 0 
        ? sale.beneficiaries 
        : [{ kind: 'Client', person: sale.client }];

      for (const beneficiary of beneficiaries) {
        // Check if subscription already exists to avoid duplicates
        const existingSub = await Subscription.findOne({
          beneficiaryType: beneficiary.kind,
          beneficiaryId: beneficiary.person,
          plan: sale.plan,
          tenant: sale.tenant,
          status: { $in: ['active', 'pending'] }
        });

        if (!existingSub) {
          await Subscription.create({
            beneficiaryType: beneficiary.kind,
            beneficiaryId: beneficiary.person,
            plan: sale.plan,
            tenant: sale.tenant,
            priceMonthly: sale.value, // Usually the plan price, but used sale.value as total for simplicity or logic per beneficiary
            status: 'active',
            startDate: new Date()
          });
          logger.info(`Subscription automatically created for ${beneficiary.kind} ${beneficiary.person} following sale approval.`);
        }

        // Sync policyNumber back to beneficiary record
        if (sale.policyNumber) {
          if (beneficiary.kind === 'Client') {
            await Client.findByIdAndUpdate(beneficiary.person, { policyNumber: sale.policyNumber });
          } else {
            await Member.findByIdAndUpdate(beneficiary.person, { policyNumber: sale.policyNumber, status: 'active' });
          }
          logger.info(`Policy number ${sale.policyNumber} synced to ${beneficiary.kind} ${beneficiary.person}`);
        }
      }
    } catch (subErr) {
      logger.error('Error auto-creating subscriptions for beneficiaries:', subErr);
    }

    // Trigger Push Notification to the Broker
    try {
      // Create Initial Invoice for the sale amount
      const existingInv = await Invoice.findOne({ sale: sale._id });
      if (!existingInv) {
        const client = await Client.findById(sale.client);
        let dueDay = 5;
        if (client && client.preferredPaymentDate) {
          dueDay = new Date(client.preferredPaymentDate).getUTCDate();
        }
        
        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
        // If due day is passed, set to current month if within grace, or next month
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        await Invoice.create({
          tenant: sale.tenant,
          client: sale.client,
          sale: sale._id,
          amount: sale.value,
          dueDate: dueDate,
          status: 'open',
          invoiceNumber: `INV-${sale._id.toString().slice(-6)}-${Date.now().toString().slice(-4)}`
        });
        logger.info(`Initial Invoice automatically created for sale ${sale._id}`);
      }

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

export const deleteSale = async (req: any, res: Response) => {
  try {
    let query: any = { _id: req.params.id, tenant: req.tenantId };
    
    if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }

    const sale = await Sale.findOneAndDelete(query);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found or unauthorized' });
    }

    const io = getIO();
    io.emit('sale:deleted', req.params.id);

    res.json({ message: 'Venda removida com sucesso' });
  } catch (error: any) {
    logger.error(`Delete Sale Error: ${error}`);
    res.status(500).json({ message: 'Error deleting sale' });
  }
};

export const updateSale = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Update Sale Request: ${id} for tenant ${req.tenantId}`);
    const { 
      client, plan, value, paymentMethod, 
      contractNumber, policyNumber, notes, status 
    } = req.body;

    const querySale: any = { _id: id };
    if (req.tenantId) {
      querySale.tenant = req.tenantId;
    }
    const sale = await Sale.findOne(querySale);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // Restrict editing if needed (e.g. only if pending, or if admin)
    if (req.user.role === 'broker' && sale.status !== 'pending') {
      return res.status(403).json({ message: 'Cannot edit an approved sale' });
    }

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { 
        client, plan, value, paymentMethod, 
        contractNumber, policyNumber, notes, status 
      },
      { new: true }
    );

    // If updated to 'approved' manually, ensure subscription exists
    if (status === 'approved') {
      try {
        const existingSub = await Subscription.findOne({
          beneficiaryId: updatedSale?.client,
          plan: updatedSale?.plan,
          tenant: updatedSale?.tenant,
          status: { $in: ['active', 'pending'] }
        });

        if (!existingSub && updatedSale) {
          await Subscription.create({
            beneficiaryType: 'Client',
            beneficiaryId: updatedSale.client,
            plan: updatedSale.plan,
            tenant: updatedSale.tenant,
            priceMonthly: updatedSale.value,
            status: 'active',
            startDate: new Date()
          });
        }
      } catch (subErr) {
        logger.error('Error auto-creating subscription in updateSale:', subErr);
      }
    }

    const io = getIO();
    io.emit('sale:updated', updatedSale);

    res.json(updatedSale);
  } catch (error: any) {
    logger.error(`Update Sale Error: ${error}`);
    res.status(500).json({ message: 'Error updating sale' });
  }
};
