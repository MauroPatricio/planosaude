import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to Excel
 */
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export data to PDF Table
 */
export const exportToPDF = (
  title: string, 
  headers: string[][], 
  data: any[][], 
  fileName: string
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

  autoTable(doc, {
    startY: 35,
    head: headers,
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Primary-600 approx
    styles: { fontSize: 8, cellPadding: 3 },
  });

  doc.save(`${fileName}.pdf`);
};
