import { type Response } from 'express';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import Commission from '../models/Commission.js';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const isBroker = req.user.role === 'broker';

    // Base filters
    const saleMatch: any = { tenant: tenantId, status: 'approved' };
    const clientMatch: any = { tenant: tenantId };
    const commissionMatch: any = { tenant: tenantId, status: 'pending' };

    if (isBroker) {
      saleMatch.broker = req.user._id;
      clientMatch.broker = req.user._id;
      commissionMatch.broker = req.user._id;
    }

    const totalSales = await Sale.aggregate([
      { $match: saleMatch },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);

    const totalClients = await Client.countDocuments(clientMatch);
    
    const pendingCommissions = await Commission.aggregate([
      { $match: commissionMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const salesProcessed = await Sale.countDocuments(saleMatch);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalClients,
      pendingCommissions: pendingCommissions[0]?.total || 0,
      salesProcessed
    });
  } catch (error: any) {
    logger.error(`Dashboard Stats Error: ${error}`);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
