

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import type { OrderData, ExpenseItem, PurchaseOrder } from './types';

// We need to extend the jsPDF type to include autoTable, as the type definitions are separate
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDFWithAutoTable;
}

const formatRupiah = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

interface ExportParams {
    reportType?: 'sales' | 'profit' | 'all';
    date: DateRange | undefined;
    detailedFinancials: {
        totalRevenue: number;
        totalCogs: number;
        grossProfit: number;
        totalOperationalExpenses: number;
        totalIngredientCost: number;
        netProfit: number;
        ordersWithCost: (OrderData & { id: string; completedAt: any; cogs: number; profit: number; })[];
        expenses: ExpenseItem[];
        completedPOs: PurchaseOrder[];
    };
    companyName: string;
}

export const exportFinancialsToPDF = ({
    reportType = 'all',
    date,
    detailedFinancials,
    companyName,
}: ExportParams) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const now = new Date();
    
    const dateRangeText = date?.from 
        ? `Periode: ${format(date.from, 'd LLL yyyy', { locale: id })} - ${date.to ? format(date.to, 'd LLL yyyy', { locale: id }) : format(date.from, 'd LLL yyyy', { locale: id })}`
        : 'Periode: Semua Waktu';

    doc.setFontSize(18);
    doc.text(`Laporan Keuangan ${companyName}`, 14, 22);
    doc.setFontSize(11);
    doc.text(dateRangeText, 14, 30);
    
    let lastY = 35;

    if (reportType === 'sales' || reportType === 'all') {
        doc.setFontSize(14);
        doc.text('Laporan Penjualan', 14, lastY + 10);
        const salesHead = [['Waktu', 'Nama Pembeli', 'No. Meja', 'Item', 'Subtotal', 'PPN', 'Servis', 'Total Akhir']];
        const salesBody = detailedFinancials.ordersWithCost.map(order => [
            order.completedAt ? format(order.completedAt.toDate(), 'Pp', { locale: id }) : 'N/A',
            order.customerName,
            order.tableNumber || 'N/A',
            order.items.map(i => `${i.quantity}x ${i.name}`).join('\n'),
            formatRupiah(order.subtotal),
            formatRupiah(order.ppnAmount),
            formatRupiah(order.serviceChargeAmount),
            formatRupiah(order.total)
        ]);
        doc.autoTable({ startY: lastY + 15, head: salesHead, body: salesBody });
        lastY = (doc as any).lastAutoTable.finalY;
    }

    if (reportType === 'profit' || reportType === 'all') {
        doc.setFontSize(14);
        doc.text('Laporan Laba Kotor', 14, lastY + 10);
        const profitHead = [['Waktu', 'Nama Pembeli', 'Pendapatan (Subtotal)', 'HPP', 'Laba Kotor']];
        const profitBody = detailedFinancials.ordersWithCost.map(order => [
            order.completedAt ? format(order.completedAt.toDate(), 'Pp', { locale: id }) : 'N/A',
            order.customerName,
            formatRupiah(order.subtotal), // Revenue is based on subtotal
            formatRupiah(order.cogs),
            formatRupiah(order.subtotal - order.cogs) // Profit is subtotal - cogs
        ]);
        doc.autoTable({ startY: lastY + 15, head: profitHead, body: profitBody });
         lastY = (doc as any).lastAutoTable.finalY;
    }

    if (reportType === 'all') {
        doc.setFontSize(14);
        doc.text('Rincian Beban Operasional', 14, lastY + 10);
        const expensesHead = [['Tanggal', 'Nama Beban', 'Jumlah']];
        const expensesBody = detailedFinancials.expenses.map(expense => [
            expense.date ? format(expense.date.toDate(), 'P', { locale: id }) : 'N/A',
            expense.name,
            formatRupiah(expense.amount)
        ]);
        doc.autoTable({ startY: lastY + 15, head: expensesHead, body: expensesBody });
        lastY = (doc as any).lastAutoTable.finalY;

        doc.setFontSize(14);
        doc.text('Rincian Beban Bahan Baku (dari PO Selesai)', 14, lastY + 10);
        const poHead = [['Tanggal Diterima', 'ID Order', 'Vendor', 'Total']];
        const poBody = detailedFinancials.completedPOs.map(po => [
            po.receivedDate ? format(po.receivedDate.toDate(), 'P', { locale: id }) : 'N/A',
            po.id,
            po.vendorName,
            formatRupiah(po.totalAmount)
        ]);
        doc.autoTable({ startY: lastY + 15, head: poHead, body: poBody });
        lastY = (doc as any).lastAutoTable.finalY;
    }
    
    doc.setFontSize(14);
    doc.text('Ringkasan Keuangan', 14, lastY + 10);
   
    doc.autoTable({
        startY: lastY + 15,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0,0,0] },
        body: [
            ['Total Pendapatan (Subtotal)', formatRupiah(detailedFinancials.totalRevenue)],
            ['Total HPP', formatRupiah(detailedFinancials.totalCogs)],
            ['Laba Kotor', { content: formatRupiah(detailedFinancials.grossProfit), styles: { fontStyle: 'bold' } }],
            ['Total Beban Bahan Baku', formatRupiah(detailedFinancials.totalIngredientCost)],
            ['Total Beban Operasional', formatRupiah(detailedFinancials.totalOperationalExpenses)],
            ['Laba Bersih', { content: formatRupiah(detailedFinancials.netProfit), styles: { fontStyle: 'bold' } }],
        ]
    });
    
    doc.save(`laporan_keuangan_${companyName.toLowerCase().replace(/\s/g, '_')}_${format(now, 'yyyy-MM-dd')}.pdf`);
};
