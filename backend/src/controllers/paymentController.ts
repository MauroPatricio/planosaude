import { type Request, type Response } from 'express';
import Invoice from '../models/Invoice.js';
import Subscription from '../models/Subscription.js';
import Client from '../models/Client.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { sendNotification } from './notificationController.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { client, subscription, amount, dueDate, notes, invoiceNumber } = req.body;
    
    const newInvoice = await Invoice.create({
      tenant: req.tenantId,
      client,
      subscription,
      amount,
      dueDate,
      notes,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      status: 'open'
    });

    res.status(201).json(newInvoice);
  } catch (error: any) {
    logger.error(`Create Invoice Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao criar fatura' });
  }
};

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = { tenant: req.tenantId };
    
    // If client, only see their own invoices
    if (req.user.role === 'client') {
      query.client = req.user.clientId;
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name email')
      .populate('subscription')
      .sort({ dueDate: -1 });

    res.json(invoices);
  } catch (error: any) {
    logger.error(`Get Invoices Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao procurar faturas' });
  }
};

export const submitPaymentProof = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    let paymentProofUrl = req.body.paymentProofUrl;

    // Check if a file was uploaded via multer
    if (req.file) {
      paymentProofUrl = `/uploads/${req.file.filename}`;
    }

    const invoice = await Invoice.findOne({ _id: id, tenant: req.tenantId });
    if (!invoice) return res.status(404).json({ message: 'Fatura não encontrada' });

    invoice.status = 'pending'; // Status changes to pending validation
    invoice.paymentMethod = paymentMethod || 'bank_transfer';
    invoice.paymentProofUrl = paymentProofUrl;
    
    await invoice.save();

    // Notify Admins
    const admins = await User.find({ tenant: req.tenantId, role: { $in: ['admin', 'manager', 'broker'] } });
    for (const admin of admins) {
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (admin._id as any).toString(),
        type: 'info',
        title: 'Novo Comprovativo de Pagamento',
        message: `O cliente enviou um comprovativo para a fatura ${invoice.invoiceNumber}.`,
        link: '/payments'
      });
    }

    res.json(invoice);
  } catch (error: any) {
    logger.error(`Submit Proof Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao enviar comprovativo' });
  }
};

export const validatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, notes } = req.body; // 'paid' or 'rejected' or 'open'

    const invoice = await Invoice.findOne({ _id: id, tenant: req.tenantId });
    if (!invoice) return res.status(404).json({ message: 'Fatura não encontrada' });

    invoice.status = status;
    invoice.validationDate = new Date();
    
    if (status === 'paid') {
      invoice.paidAt = new Date();
      
      // If payment is for a subscription, activate it if it was pending
      if (invoice.subscription) {
        await Subscription.findByIdAndUpdate(invoice.subscription, { status: 'active' });
      }
    }
    
    if (status === 'rejected') {
      invoice.rejectionReason = rejectionReason;
    }
    
    if (notes) invoice.notes = notes;

    await invoice.save();

    // Notify Client
    const clientUser = await User.findOne({ clientId: invoice.client });
    if (clientUser) {
      const isSuccess = status === 'paid';
      const isRejected = status === 'rejected';
      
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (clientUser._id as any).toString(),
        type: isSuccess ? 'success' : isRejected ? 'error' : 'warning',
        title: `Pagamento ${isSuccess ? 'Confirmado' : isRejected ? 'Rejeitado' : 'Atualizado'}`,
        message: isSuccess 
          ? `O seu pagamento para a fatura ${invoice.invoiceNumber} foi confirmado com sucesso.` 
          : isRejected 
          ? `O seu comprovativo foi rejeitado: ${rejectionReason || 'Dados inválidos'}.`
          : `O estado da sua fatura ${invoice.invoiceNumber} foi atualizado para ${status}.`,
        link: '/portal'
      });
    }

    res.json(invoice);
  } catch (error: any) {
    logger.error(`Validate Payment Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao validar pagamento' });
  }
};

/**
 * Utility to generate monthly invoices for all active subscriptions
 * This would normally be called by a CRON job on the 1st of each month.
 */
export const generateMonthlyInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const activeSubscriptions = await Subscription.find({ 
      tenant: req.tenantId, 
      status: 'active' 
    }).populate('plan');

    const createdInvoices = [];
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    for (const sub of activeSubscriptions as any) {
      const invNumber = `INV-${sub.beneficiaryId}-${month}-${year}`;
      
      // Check if already exists to avoid duplicates
      const exists = await Invoice.findOne({ invoiceNumber: invNumber });
      if (exists) continue;

      // Determine due date based on client's preferred payment date
      let dueDay = 5; // Default
      if (sub.beneficiaryType === 'Client') {
        const client = await Client.findById(sub.beneficiaryId);
        if (client && client.preferredPaymentDate) {
          dueDay = new Date(client.preferredPaymentDate).getDate();
        }
      }

      const inv = await Invoice.create({
        tenant: req.tenantId,
        client: sub.beneficiaryId,
        subscription: sub._id,
        amount: sub.plan.priceMonthly,
        dueDate: new Date(year, month, dueDay), // Due on the preferred day of next month
        invoiceNumber: invNumber,
        status: 'open'
      });
      createdInvoices.push(inv);
    }

    res.status(201).json({ 
      message: `${createdInvoices.length} faturas geradas com sucesso.`,
      count: createdInvoices.length 
    });
  } catch (error: any) {
    logger.error(`Generate Invoices Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao gerar faturas mensais' });
  }
};

export const getClientPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const queryClient: any = {};
    if (req.tenantId) {
      queryClient.tenant = req.tenantId;
    }
    
    if (req.query.institutionId) {
      queryClient.institution = new mongoose.Types.ObjectId(req.query.institutionId as string);
    } else {
      queryClient.status = 'active'; // Default behavior for general summary
    }

    // 1. Get clients
    const clients = await Client.find(queryClient)
    .select('name email phone institution preferredPaymentDate documentId status broker policyNumber')
    .populate('institution', 'name')
    .populate('broker', 'name');

    // 2. Get all non-cancelled invoices for these clients
    const queryInv: any = { status: { $ne: 'cancelled' } };
    if (req.tenantId) {
      queryInv.tenant = req.tenantId;
    }
    const invoices = await Invoice.find(queryInv).sort({ dueDate: -1 });

    // 3. Get subscriptions for these clients to find their plans
    const querySub: any = {
      beneficiaryId: { $in: clients.map(c => c._id) },
      status: { $in: ['active', 'pending'] }
    };
    if (req.tenantId) {
      querySub.tenant = req.tenantId;
    }
    const subscriptions = await Subscription.find(querySub).populate('plan', 'name');

    // 4. Map clients to their latest invoice status and plan
    const summary = clients.map(client => {
      const clientInvoices = invoices.filter(inv => inv.client.toString() === client._id.toString());
      const latestInvoice = clientInvoices[0];
      
      const sub = subscriptions.find(s => s.beneficiaryId.toString() === client._id.toString());
      
      // Calculate fallback values if invoice is missing
      let displayAmount = 0;
      let displayDueDate: any = client.preferredPaymentDate;
      let statusLabel = 'no_invoice';
      
      if (latestInvoice && latestInvoice.status !== 'paid' && latestInvoice.status !== 'cancelled') {
        displayAmount = latestInvoice.amount;
        displayDueDate = latestInvoice.dueDate;
        statusLabel = latestInvoice.status;
      } else if (sub) {
        displayAmount = sub.priceMonthly;
        // Estimate next due date if no active invoice
        const now = new Date();
        const preferredDay = client.preferredPaymentDate ? new Date(client.preferredPaymentDate).getDate() : 5;
        const estimatedDate = new Date(now.getFullYear(), now.getMonth(), preferredDay);
        // If preferred day passed, show next month
        if (estimatedDate < now && (!latestInvoice || latestInvoice.status === 'paid')) {
          estimatedDate.setMonth(estimatedDate.getMonth() + 1);
        }
        displayDueDate = estimatedDate;
        statusLabel = 'recorrente';
      }

      return {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        documentId: client.documentId,
        status: client.status,
        policyNumber: client.policyNumber || '---',
        brokerName: (client.broker as any)?.name || 'N/A',
        institutionName: (client.institution as any)?.name || 'Particular',
        planName: (sub?.plan as any)?.name || 'Sem Plano Ativo',
        amount: displayAmount,
        dueDate: displayDueDate,
        invoiceStatus: statusLabel,
        latestInvoice: latestInvoice ? {
          _id: latestInvoice._id,
          invoiceNumber: latestInvoice.invoiceNumber,
          amount: latestInvoice.amount,
          status: latestInvoice.status,
          dueDate: latestInvoice.dueDate,
          notes: latestInvoice.notes,
          paymentMethod: latestInvoice.paymentMethod
        } : null,
        invoiceCount: clientInvoices.length
      };
    });

    res.json(summary);
  } catch (error: any) {
    logger.error(`Get Payment Status Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao carregar sumário de pagamentos' });
  }
};

export const simulateMpesaPayment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { phoneNumber } = req.body;

    const invoice = await Invoice.findOne({ _id: id, tenant: req.tenantId });
    if (!invoice) return res.status(404).json({ message: 'Fatura não encontrada' });

    // In a real scenario, we would call the M-PESA API here.
    // For MVP, we simulate a successful transaction after a brief verification.
    invoice.status = 'paid';
    invoice.paymentMethod = 'm-pesa';
    invoice.paidAt = new Date();
    invoice.notes = `Pago via M-PESA (${phoneNumber})`;
    
    await invoice.save();

    // Notify Admins about the automated payment
    const admins = await User.find({ tenant: req.tenantId, role: { $in: ['admin', 'manager'] } });
    for (const admin of admins) {
      await sendNotification({
        tenantId: req.tenantId as string,
        recipientId: (admin._id as any).toString(),
        type: 'success',
        title: 'Pagamento Recebido (M-PESA)',
        message: `Recebido pagamento automático da fatura ${invoice.invoiceNumber}.`,
        link: '/payments'
      });
    }

    res.json({
      message: 'Pagamento M-PESA processado com sucesso',
      invoice
    });
  } catch (error: any) {
    logger.error(`M-PESA Simulation Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao processar pagamento M-PESA' });
  }
};
