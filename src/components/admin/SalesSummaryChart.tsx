
"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { OrderData } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

const formatRupiah = (value: number) => {
    if (value < 1000) return `Rp ${value}`;
    if (value < 1000000) return `Rp ${Math.floor(value / 1000)}rb`;
    return `Rp ${Math.floor(value / 1000000)}jt`;
}

export function SalesSummaryChart() {
    const [orders, setOrders] = useState<(OrderData & { completedAt: Timestamp })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const sevenDaysAgo = subDays(new Date(), 6);
        const startOfSevenDaysAgo = startOfDay(sevenDaysAgo);

        const q = query(
            collection(db, "completed_orders"),
            where("completedAt", ">=", startOfSevenDaysAgo),
            orderBy("completedAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => doc.data() as (OrderData & { completedAt: Timestamp }));
            setOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching sales data: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const chartData = useMemo(() => {
        const dailyRevenue: { [key: string]: number } = {};

        // Initialize last 7 days with 0 revenue
        for (let i = 0; i < 7; i++) {
            const day = subDays(new Date(), i);
            const formattedDate = format(day, 'yyyy-MM-dd');
            dailyRevenue[formattedDate] = 0;
        }

        orders.forEach(order => {
            if (order.completedAt) {
                const date = order.completedAt.toDate();
                const formattedDate = format(date, 'yyyy-MM-dd');
                if (dailyRevenue.hasOwnProperty(formattedDate)) {
                    dailyRevenue[formattedDate] += order.total;
                }
            }
        });

        return Object.keys(dailyRevenue).map(date => ({
            date: format(new Date(date), 'd MMM', { locale: id }),
            Pendapatan: dailyRevenue[date]
        })).reverse(); // Reverse to show oldest to newest

    }, [orders]);

    if (isLoading) {
        return <Skeleton className="h-[150px] w-full" />;
    }

    return (
        <ChartContainer config={{
            Pendapatan: { label: 'Pendapatan', color: 'hsl(var(--chart-1))' },
        }} className="h-[150px] w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        tickMargin={10} 
                        axisLine={false} 
                        fontSize={12}
                    />
                    <YAxis 
                        tickFormatter={(value) => formatRupiah(Number(value))}
                        fontSize={12}
                    />
                    <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent 
                            formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value))}
                            indicator="dot" 
                        />}
                    />
                    <Bar dataKey="Pendapatan" fill="var(--color-Pendapatan)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
