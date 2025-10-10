
"use client";

import { useOrder } from '@/context/OrderContext';
import { OrderSummary } from './OrderSummary';
import { OrderTracker } from './OrderTracker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function OrderPanel() {
  const { orderItems, orderStatus, orderId } = useOrder();

  const isTrackingMode = orderId && orderStatus !== 'Idle' && orderStatus !== 'Delivered';
  const isOrderingMode = orderItems.length > 0 && !isTrackingMode;


  return (
    <div className="space-y-8">
      {isTrackingMode ? (
        <OrderTracker />
      ) : isOrderingMode ? (
        <>
          <OrderSummary />
        </>
      ) : (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Pesanan Anda</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Keranjang Anda kosong. Tambahkan item untuk memulai!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
