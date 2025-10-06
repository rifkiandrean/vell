

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { PurchaseOrder, Vendor, CompanyInfo } from './types';

// Extend jsPDF type to include autoTable
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

// Helper to convert image URL to Base64. It now assumes the URL is publicly accessible.
const imageUrlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


interface ExportPOParams {
    po: PurchaseOrder;
    vendor: Vendor;
    companyInfo: CompanyInfo;
}

export const exportPOToPDF = async ({ po, vendor, companyInfo }: ExportPOParams) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const now = new Date();
    
    // --- Header ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', 14, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`PO ID: ${po.id}`, 14, 28);
    doc.text(`Tanggal Order: ${format(po.orderDate.toDate(), 'd LLL yyyy', { locale: id })}`, 14, 34);

    // --- Company & Vendor Info ---
    const companyX = 14;
    const vendorX = 110;
    const startY = 44;
    
    doc.setFontSize(10); // Reduce font size for this section
    
    doc.setFont('helvetica', 'bold');
    doc.text('DARI:', companyX, startY);
    doc.setFont('helvetica', 'normal');
    let companyInfoY = startY + 5;
    doc.text(companyInfo.companyName, companyX, companyInfoY);
    if (companyInfo.address) {
        companyInfoY += 5;
        doc.text(companyInfo.address, companyX, companyInfoY, { maxWidth: 80 });
        companyInfoY += (doc.getTextDimensions(companyInfo.address, { maxWidth: 80 }).h) - 5;
    }
     if (companyInfo.phone) {
        companyInfoY += 5;
        doc.text(companyInfo.phone, companyX, companyInfoY);
    }
     if (companyInfo.email) {
        companyInfoY += 5;
        doc.text(companyInfo.email, companyX, companyInfoY);
    }

    
    doc.setFont('helvetica', 'bold');
    doc.text('KEPADA:', vendorX, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(vendor.name, vendorX, startY + 5);
    doc.text(vendor.address, vendorX, startY + 10);
    doc.text(vendor.phone, vendorX, startY + 15);
    doc.text(vendor.email, vendorX, startY + 20);

    // --- Items Table ---
    const tableStartY = Math.max(companyInfoY, startY + 20) + 10;
    const head = [['Nama Item', 'Jumlah', 'Satuan', 'Harga Satuan', 'Subtotal']];
    const body = po.items.map(item => [
        item.name,
        item.quantity,
        item.unit,
        formatRupiah(item.price),
        formatRupiah(item.price * item.quantity)
    ]);
    
    doc.setFontSize(12); // Reset font size for the rest of the document
    doc.autoTable({
        startY: tableStartY,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [30, 83, 36] }, // Primary color
        didDrawPage: (data) => {
            // Footer on each page if needed
        }
    });

    // --- Totals ---
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 140, finalY);
    doc.text(formatRupiah(po.totalAmount), 200, finalY, { align: 'right' });

    // --- Notes ---
    finalY += 10;
    if (po.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Catatan:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text(po.notes, 14, finalY + 6, { maxWidth: 180 });
        finalY += 20;
    }

    // --- Signatures ---
    const signatureY = finalY + 10;
    const spvX = 14;
    const managerX = 80;

    doc.setFontSize(10);
    
    // SPV Signature
    if (companyInfo.spvSignatureUrl) {
      try {
        const spvSignatureBase64 = await imageUrlToBase64(companyInfo.spvSignatureUrl);
        doc.text('Diketahui oleh,', spvX, signatureY);
        doc.addImage(spvSignatureBase64, 'PNG', spvX, signatureY + 2, 40, 20); // Adjust size as needed
        doc.text('Spv F&B', spvX, signatureY + 28);
      } catch (error) {
        console.error("Gagal memuat gambar tanda tangan Spv:", error);
        doc.text('Gagal memuat tanda tangan.', spvX, signatureY + 10);
      }
    }
    
    // Manager Signature
    if (companyInfo.managerSignatureUrl) {
      try {
        const managerSignatureBase64 = await imageUrlToBase64(companyInfo.managerSignatureUrl);
        doc.text('Disetujui oleh,', managerX, signatureY);
        doc.addImage(managerSignatureBase64, 'PNG', managerX, signatureY + 2, 40, 20); // Adjust size as needed
        doc.text('Manajer', managerX, signatureY + 28);
      } catch (error) {
        console.error("Gagal memuat gambar tanda tangan Manajer:", error);
        doc.text('Gagal memuat tanda tangan.', managerX, signatureY + 10);
      }
    }


    doc.save(`PO_${po.id}.pdf`);
};
