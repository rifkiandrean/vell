
"use client";

import { useOrder } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { SugarLevel } from '@/lib/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

const sugarLevelLabels: Record<SugarLevel, string> = {
  'Less Sugar': 'Rendah Gula',
  'Normal': 'Normal',
  'Extra Sugar': 'Tambah Gula',
};

interface OrderSummaryProps {
  isCashier?: boolean;
}

export function OrderSummary({ isCashier = false }: OrderSummaryProps) {
  const { 
    orderItems, 
    subtotal,
    ppnAmount,
    serviceChargeAmount,
    totalPrice, 
    updateQuantity, 
    removeFromOrder, 
    initiateOrder, 
    tableNumber, 
    customerName, 
    whatsappNumber, 
    setCustomerDetails, 
    setTableNumber, 
    isProcessingOrder 
  } = useOrder();

  const getCustomizationText = (customizations: any) => {
    const parts = [];
    if (customizations.spiciness) {
      parts.push(customizations.spiciness);
    }
    if (customizations.sugarLevel) {
      parts.push(sugarLevelLabels[customizations.sugarLevel as SugarLevel]);
    }
    if (customizations.toppings && customizations.toppings.length > 0) {
      parts.push(customizations.toppings.map((t:any) => t.name).join(', '));
    }
    return parts.join(', ');
  }

  const isButtonDisabled = isCashier
    ? orderItems.length === 0 || !customerName || isProcessingOrder
    : orderItems.length === 0 || !customerName || !tableNumber || isProcessingOrder;

  const formattedTableNumber = tableNumber
    ? tableNumber.charAt(0).toUpperCase() + tableNumber.slice(1)
    : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 font-headline">
            <ShoppingCart className="h-6 w-6" />
            Pesanan Saat Ini
            </CardTitle>
            {tableNumber && (
                <div className="text-sm font-semibold border rounded-full px-3 py-1 bg-muted">
                    {formattedTableNumber}
                </div>
            )}
        </div>

      </CardHeader>
      <CardContent>
        {orderItems.length > 0 ? (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {orderItems.map(item => (
                <div key={item.id} className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{item.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getCustomizationText(item.customizations)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="font-semibold">{formatRupiah(item.totalPrice)}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 mt-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromOrder(item.id)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
             <p className="text-muted-foreground text-center">Keranjang Anda kosong.</p>
        )}

        {orderItems.length > 0 && (
          <>
            <Separator className="my-4" />
             <div className="space-y-4">
                {isCashier && (
                  <div>
                      <Label htmlFor="tableNumber">Nomor Meja (Opsional)</Label>
                      <Input 
                          id="tableNumber" 
                          placeholder="Kosongkan untuk Take Away"
                          value={tableNumber || ''}
                          onChange={(e) => setTableNumber(e.target.value)}
                      />
                  </div>
                )}
                <div>
                    <Label htmlFor="customerName">Nama Pembeli</Label>
                    <Input 
                        id="customerName" 
                        placeholder="Masukkan nama pembeli"
                        value={customerName}
                        onChange={(e) => setCustomerDetails({ customerName: e.target.value })}
                        required
                    />
                </div>
                {!isCashier && (
                  <div>
                      <Label htmlFor="whatsappNumber">Nomor WhatsApp</Label>
                      <Input 
                          id="whatsappNumber" 
                          type="tel"
                          placeholder="cth., 08123456789"
                          value={whatsappNumber}
                          onChange={(e) => setCustomerDetails({ whatsappNumber: e.target.value })}
                          required
                      />
                  </div>
                )}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">PPN</span>
                    <span>{formatRupiah(ppnAmount)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span>{formatRupiah(serviceChargeAmount)}</span>
                </div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatRupiah(totalPrice)}</span>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={initiateOrder} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isButtonDisabled}>
          {isProcessingOrder ? "Memproses Pesanan..." : "Pesan & Bayar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
