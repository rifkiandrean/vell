
"use client";

import React, { forwardRef } from 'react';
import type { OrderData } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type PrinterType = 'thermal' | 'standard';

interface BillReceiptProps {
  order: OrderData;
  printerType?: PrinterType;
}

const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export const BillReceipt = forwardRef<HTMLDivElement, BillReceiptProps>(({ order, printerType = 'standard' }, ref) => {
  const { companyName, address, phone } = useAuth();
  
  return (
    <div ref={ref} className={cn(
        "bg-white text-black p-4 font-mono text-xs",
        printerType === 'thermal' ? "w-[240px]" : "w-full"
    )}>
        <div className="text-center mb-4">
            <h1 className="font-bold text-sm">{companyName}</h1>
            {address && <p>{address}</p>}
            {phone && <p>Telp: {phone}</p>}
        </div>
        
        <div className="border-t border-b border-dashed border-black py-1 mb-2">
            <div className="flex justify-between">
                <span>No. Bill:</span>
                <span>{order.id}</span>
            </div>
            <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{order.completedAt ? format(order.completedAt.toDate(), 'dd/MM/yy HH:mm', { locale: localeID }) : 'N/A'}</span>
            </div>
             <div className="flex justify-between">
                <span>Customer:</span>
                <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
                <span>Meja:</span>
                <span>{order.tableNumber || 'Take Away'}</span>
            </div>
        </div>

        <div>
            {order.items.map((item, index) => (
                <div key={index} className="mb-1">
                    <p>{item.name}</p>
                    <div className="flex justify-between">
                        <span>{item.quantity} x {formatRupiah(item.price / item.quantity)}</span>
                        <span>{formatRupiah(item.price)}</span>
                    </div>
                </div>
            ))}
        </div>

        <div className="border-t border-dashed border-black mt-2 pt-2">
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
                <span>PPN</span>
                <span>{formatRupiah(order.ppnAmount)}</span>
            </div>
            <div className="flex justify-between">
                <span>Service</span>
                <span>{formatRupiah(order.serviceChargeAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mt-1">
                <span>TOTAL</span>
                <span>{formatRupiah(order.total)}</span>
            </div>
        </div>

        <div className="text-center mt-4">
            <p>Terima kasih atas kunjungan Anda!</p>
        </div>
    </div>
  );
});

BillReceipt.displayName = 'BillReceipt';
