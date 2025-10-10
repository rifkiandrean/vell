
"use client";

import { useOrder } from '@/context/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, CookingPot, UtensilsCrossed, PackageCheck, Hourglass } from 'lucide-react';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const CANCELLATION_TIME_MS = 10 * 60 * 1000; // 10 minutes

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'Pending Payment', label: 'Pembayaran', icon: Hourglass },
  { status: 'Placed', label: 'Dipesan', icon: CheckCircle2 },
  { status: 'Preparing', label: 'Disiapkan', icon: CookingPot },
  { status: 'Served', label: 'Disajikan', icon: UtensilsCrossed },
  // { status: 'Delivered', label: 'Selesai', icon: PackageCheck }, // Hiding for now
];

export function OrderTracker() {
  const { orderStatus, orderProgress, createdAt, orderId } = useOrder();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  const currentStatusIndex = statusSteps.findIndex(step => step.status === orderStatus);
  const currentLabel = statusSteps[currentStatusIndex]?.label || 'Melacak pesanan Anda...';

   useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (orderStatus === 'Pending Payment' && createdAt) {
      const calculateTimeLeft = () => {
        const deadline = createdAt.getTime() + CANCELLATION_TIME_MS;
        const now = Date.now();
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeLeft("Waktu pembayaran habis.");
          clearInterval(intervalId);
          return;
        }

        const minutes = Math.floor((diff / 1000) / 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`Sisa waktu pembayaran: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };

      calculateTimeLeft(); // Initial call
      intervalId = setInterval(calculateTimeLeft, 1000);
    } else {
      setTimeLeft(null);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [orderStatus, createdAt]);


  if (orderStatus === 'Idle' || orderStatus === 'Delivered') {
    return null;
  }

  return (
    <Card className="animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="font-headline">Status Pesanan</CardTitle>
        {orderId && <CardDescription className="font-mono text-xs pt-1">{orderId}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
           <div className="flex justify-between">
            {statusSteps.map((step, index) => (
              <div key={step.status} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  index <= currentStatusIndex ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-muted-foreground/20 text-muted-foreground"
                )}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                    "text-xs text-center",
                    index <= currentStatusIndex ? "font-semibold text-primary" : "text-muted-foreground"
                )}>{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={orderProgress} className="h-3" />
          <div className="text-center pt-2">
            <p className="font-semibold text-lg text-primary">{currentLabel}</p>
             {orderStatus === 'Pending Payment' && (
                <p className="text-sm text-muted-foreground">
                    {timeLeft ?? "Silakan selesaikan pembayaran di kasir"}
                </p>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    