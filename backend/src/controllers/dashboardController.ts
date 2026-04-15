import mongoose from 'mongoose';
import { type Response } from 'express';
import Sale from '../models/Sale.js';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import Commission from '../models/Commission.js';
import Institution from '../models/Institution.js';
import Lead from '../models/Lead.js';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { brokerId, institutionId } = req.query;
    const isBroker = req.user.role === 'broker';

    const tId = new mongoose.Types.ObjectId(tenantId);
    
    // Base filters (Lifetime)
    const baseMatch: any = { tenant: tId };
    
    if (isBroker) {
      baseMatch.broker = new mongoose.Types.ObjectId(req.user._id);
    } else if (brokerId && brokerId !== '') {
      baseMatch.broker = new mongoose.Types.ObjectId(brokerId);
    }

    if (institutionId && institutionId !== '') {
      baseMatch.institution = new mongoose.Types.ObjectId(institutionId);
    }

    const saleMatch: any = { ...baseMatch, status: 'approved' };
    const clientMatch: any = { ...baseMatch };
    const commissionMatch: any = { ...baseMatch, status: 'pending' };
    
    // Today's filter
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todayMatch = { 
      ...saleMatch, 
      createdAt: { $gte: startOfToday, $lte: endOfToday } 
    };

    const [totalSales, todaySales, totalClients, todayClients, pendingCommissions, salesProcessed, totalInstitutions] = await Promise.all([
      Sale.aggregate([
        { $match: saleMatch },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]),
      Sale.aggregate([
        { $match: todayMatch },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$value' } } }
      ]),
      Client.countDocuments(clientMatch),
      Client.countDocuments({ ...clientMatch, createdAt: { $gte: startOfToday, $lte: endOfToday } }),
      Commission.aggregate([
        { $match: commissionMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Sale.countDocuments(saleMatch),
      Institution.countDocuments(baseMatch)
    ]);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      todaySales: todaySales[0]?.total || 0,
      todaySalesCount: todaySales[0]?.count || 0,
      totalClients,
      todayClients,
      pendingCommissions: pendingCommissions[0]?.total || 0,
      salesProcessed,
      totalInstitutions
    });
  } catch (error: any) {
    logger.error(`Dashboard Stats Error: ${error.message}`);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

export const getDashboardCharts = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const isBroker = req.user.role === 'broker';
    
    const tId = new mongoose.Types.ObjectId(tenantId);

    // Last 6 months range
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const matchQuery: any = { 
      tenant: tId, 
      status: 'approved',
      createdAt: { $gte: sixMonthsAgo }
    };

    if (isBroker) {
      matchQuery.broker = new mongoose.Types.ObjectId(req.user._id);
    }

    const chartsData = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          vendas: { $sum: '$value' },
          comissoes: { $sum: { $multiply: ['$value', 0.1] } } // Assuming 10% commission
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format for Recharts { name: 'Month', vendas: X, comissoes: Y }
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const formattedData = chartsData.map(item => ({
      name: monthNames[item._id.month - 1],
      vendas: item.vendas,
      comissoes: item.comissoes
    }));

    res.json(formattedData);
  } catch (error: any) {
    logger.error(`Dashboard Charts Error: ${error.message}`);
    res.status(500).json({ message: 'Error fetching dashboard charts' });
  }
};

export const getDashboardActivities = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const isBroker = req.user.role === 'broker';

    const tId = new mongoose.Types.ObjectId(tenantId);
    const query: any = { tenant: tId };
    
    if (isBroker) query.broker = new mongoose.Types.ObjectId(req.user._id);

    // Fetch in parallel
    const [clients, sales] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).limit(5),
      Sale.find(query).sort({ createdAt: -1 }).limit(5).populate('plan').populate('client'),
    ]);

    // Format unified activities
    const activities: any[] = [
      ...clients.map(c => ({
        id: c._id,
        type: 'client',
        title: `Novo Cliente: ${c.name}`,
        subtitle: `Registado por ${req.user.name}`, // Should actually populate broker name if needed
        value: 'PERFIL',
        timestamp: (c as any).createdAt,
        status: 'Ativo'
      })),
      ...sales.map(s => ({
        id: s._id,
        type: 'sale',
        title: `Venda: ${(s.client as any)?.name || 'Cliente'}`,
        subtitle: `${(s.plan as any)?.name || 'Plano'} • Emitido`,
        value: `${s.value.toLocaleString()} MT`,
        timestamp: (s as any).createdAt,
        status: s.status.toUpperCase()
      }))
    ];

    // Sort by most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(activities.slice(0, 10));
  } catch (error: any) {
    logger.error(`Dashboard Activities Error: ${error}`);
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

export const getDashboardIntelligentData = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { period = 'last30', institutionId, brokerId } = req.query;
    const isBroker = req.user.role === 'broker';

    const tId = new mongoose.Types.ObjectId(tenantId);

    // Base filters
    const baseMatch: any = { tenant: tId };
    
    if (isBroker) {
      baseMatch.broker = new mongoose.Types.ObjectId(req.user._id);
    } else if (brokerId && brokerId !== '') {
      baseMatch.broker = new mongoose.Types.ObjectId(brokerId);
    }
    
    if (institutionId && institutionId !== '') {
      baseMatch.institution = new mongoose.Types.ObjectId(institutionId);
    }

    // Period filter
    const now = new Date();
    let startDate = new Date();
    if (period === 'last7') startDate.setDate(now.getDate() - 7);
    else if (period === 'last30') startDate.setDate(now.getDate() - 30);
    else if (period === '6months') startDate.setMonth(now.getMonth() - 6);
    else if (period === '1year') startDate.setFullYear(now.getFullYear() - 1);
    
    const periodMatch = { ...baseMatch, createdAt: { $gte: startDate } };

    // 1. KPI Aggregations
    const [
      instStats,
      clientStats,
      paymentStats,
      salesByBroker,
      leadStats,
      periodSales
    ] = await Promise.all([
      // Institutions
      Institution.aggregate([
        { $match: { tenant: tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Clients & Growth
      Client.aggregate([
        { $match: baseMatch },
        { 
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { status: 'active' } }, { $count: 'count' }],
            newThisPeriod: [{ $match: { createdAt: { $gte: startDate } } }, { $count: 'count' }]
          }
        }
      ]),
      // Payments & Inadimplência (Now using Invoices for recurring accuracy)
      Invoice.aggregate([
        { $match: baseMatch },
        {
          $facet: {
            paid: [{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
            pending: [{ $match: { status: { $in: ['open', 'pending'] } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
            late: [
              { $match: { status: 'overdue' } },
              { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]
          }
        }
      ]),
      // Performance Team
      Sale.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$broker',
            totalSales: { $sum: '$value' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        {
          $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'brokerDetails' }
        },
        { $unwind: '$brokerDetails' }
      ]),
      // Conversion Funnel
      Lead.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Sales in Period
      Sale.aggregate([
        { $match: periodMatch },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ])
    ]);

    // 2. Intelligence: Alerts & Insights
    const alerts: any[] = [];
    const insights: any[] = [];
    
    const lateVal = paymentStats[0].late[0]?.total || 0;
    const pendingVal = paymentStats[0].pending[0]?.total || 0;
    const paidVal = paymentStats[0].paid[0]?.total || 0;
    const totalVal = paidVal + pendingVal + lateVal;

    if (lateVal > 10000) {
      alerts.push({ type: 'danger', message: `Atenção: ${lateVal.toLocaleString()} MT em pagamentos com atraso > 30 dias.` });
    }

    const defaultRate = totalVal > 0 ? (lateVal / totalVal) * 100 : 0;
    if (defaultRate > 15) {
      alerts.push({ type: 'warning', message: `Alerta: Taxa de inadimplência subiu para ${defaultRate.toFixed(1)}%.` });
    }

    // Top Institution Insight
    const topInst = await Sale.aggregate([
      { $match: { ...baseMatch, status: 'approved' } },
      { $group: { _id: '$institution', revenue: { $sum: '$value' } } },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'institutions', localField: '_id', foreignField: '_id', as: 'name' } }
    ]);

    if (topInst[0] && totalVal > 0) {
      const share = (topInst[0].revenue / totalVal) * 100;
      if (share > 30) {
        insights.push(`Insight: A instituição ${topInst[0].name[0]?.name} representa ${share.toFixed(0)}% da sua receita.`);
      }
    }

    // Lead Conversion Insight
    const convertedLeads = leadStats.find(l => l._id === 'converted')?.count || 0;
    const totalLeads = leadStats.reduce((acc, curr) => acc + curr.count, 0);
    const convRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    if (convRate < 10) {
      insights.push('Dica: Recomendado focar no follow-up de leads pendentes para aumentar a conversão.');
    }

    res.json({
      kpis: {
        institutions: {
          total: instStats.reduce((acc: number, curr: any) => acc + curr.count, 0),
          active: instStats.find((i: any) => i._id === 'active')?.count || 0
        },
        sales: {
          periodTotal: periodSales[0]?.total || 0
        },
        clients: {
          total: clientStats[0].total[0]?.count || 0,
          active: clientStats[0].active[0]?.count || 0,
          new: clientStats[0].newThisPeriod[0]?.count || 0
        },
        payments: {
          paid: paidVal,
          pending: pendingVal,
          late: lateVal,
          defaultRate
        },
        conversion: {
          totalLeads,
          convRate
        },
        retention: {
          rate: clientStats[0].total[0]?.count > 0 ? (clientStats[0].active[0]?.count / clientStats[0].total[0]?.count) * 100 : 100
        }
      },
      team: salesByBroker.map((b: any) => ({
        name: b.brokerDetails.name,
        value: b.totalSales,
        count: b.count
      })),
      alerts,
      insights
    });

  } catch (error: any) {
    logger.error(`Dashboard Intelligent Data Error: ${error}`);
    res.status(500).json({ message: 'Error generating intelligent dashboard data' });
  }
};


