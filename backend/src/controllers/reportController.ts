import { type Response } from 'express';
import ExcelJS from 'exceljs';
import Sale from '../models/Sale.js';
import logger from '../utils/logger.js';

export const exportSalesReport = async (req: any, res: Response) => {
  try {
    const sales = await Sale.find().populate('client').populate('broker').populate('plan');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vendas');

    worksheet.columns = [
      { header: 'ID Venda', key: 'id', width: 25 },
      { header: 'Cliente', key: 'client', width: 25 },
      { header: 'Corretor', key: 'broker', width: 25 },
      { header: 'Plano', key: 'plan', width: 20 },
      { header: 'Valor (MT)', key: 'value', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data', key: 'date', width: 20 }
    ];

    sales.forEach(sale => {
      worksheet.addRow({
        id: sale._id,
        client: (sale.client as any)?.name || 'N/A',
        broker: (sale.broker as any)?.name || 'N/A',
        plan: (sale.plan as any)?.name || 'N/A',
        value: sale.value,
        status: sale.status,
        date: sale.createdAt
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_vendas.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    logger.error(`Export Report Error: ${err}`);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};
