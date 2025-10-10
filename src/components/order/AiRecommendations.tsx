"use client";

import { useEffect, useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { recommendMenuItems, RecommendMenuItemsOutput } from '@/ai/flows/recommend-menu-items';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '../icons';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useAuth } from '@/context/AuthContext';

export function AiRecommendations() {
  const { orderItems } = useOrder();
  const { companyName } = useAuth();
  const [recommendation, setRecommendation] = useState<RecommendMenuItemsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (orderItems.length > 0) {
      const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
          const currentOrder = orderItems.map(item => `${item.quantity}x ${item.menuItem.name}`);
          const result = await recommendMenuItems({ currentOrder, companyName });
          setRecommendation(result);
        } catch (error) {
          console.error('Failed to get AI recommendations:', error);
          setRecommendation(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      const timer = setTimeout(fetchRecommendations, 1000); // Debounce
      return () => clearTimeout(timer);

    } else {
      setRecommendation(null);
    }
  }, [orderItems, companyName]);

  if (orderItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Icons.AiSparkle className="h-6 w-6 text-primary" />
          Saran dari Chef
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : recommendation ? (
            <Alert>
                <AlertTitle className="font-bold">Anda mungkin juga suka...</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside mt-2 font-semibold text-primary">
                        {recommendation.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                    <p className="mt-3 text-sm text-muted-foreground italic">"{recommendation.reasoning}"</p>
                </AlertDescription>
            </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">Tambahkan item ke pesanan Anda untuk mendapatkan rekomendasi.</p>
        )}
      </CardContent>
    </Card>
  );
}