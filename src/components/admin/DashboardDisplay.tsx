
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SalesSummaryChart } from "./SalesSummaryChart";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { startOfDay } from 'date-fns';
import type { InventoryItem, OrderData } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";

const Widget = ({ title, children, onMaximize, className }: { title: string, children: React.ReactNode, onMaximize: () => void, className?: string }) => {
  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {children}
      </CardContent>
    </Card>
  );
};

const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

interface OrderWithId extends OrderData {
    id: string;
}


export function DashboardDisplay() {
  const [fullscreenWidget, setFullscreenWidget] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [preparingOrdersCount, setPreparingOrdersCount] = useState(0);
  const [bestSellingItems, setBestSellingItems] = useState<{ name: string; quantity: number }[]>([]);
  const [todaysRevenue, setTodaysRevenue] = useState(0);
  const [dineInQueue, setDineInQueue] = useState<OrderWithId[]>([]);
  const [takeAwayQueue, setTakeAwayQueue] = useState<OrderWithId[]>([]);


  useEffect(() => {
    const todayStart = startOfDay(new Date());

    // Listener for low stock items
    const lowStockThreshold = 5;
    const qStock = query(collection(db, "gudang"), where("stock", "<=", lowStockThreshold));
    const unsubStock = onSnapshot(qStock, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      items.sort((a, b) => a.stock - b.stock);
      setLowStockItems(items);
    });

    // Listener for new, pending, and preparing orders today
    const qOrders = query(
      collection(db, "orders"), 
      where("createdAt", ">=", todayStart)
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let placedCount = 0;
      let pendingCount = 0;
      let preparingCount = 0;
      const dineIn: OrderWithId[] = [];
      const takeAway: OrderWithId[] = [];

      snapshot.forEach(doc => {
        const order = { id: doc.id, ...doc.data() } as OrderWithId;
        if (order.status === 'Placed') {
          placedCount++;
        } else if (order.status === 'Pending Payment') {
          pendingCount++;
        } else if (order.status === 'Preparing') {
            preparingCount++;
        }
        
        if (order.status === 'Placed' || order.status === 'Preparing') {
            if (order.tableNumber) {
                dineIn.push(order);
            } else {
                takeAway.push(order);
            }
        }
      });
      setNewOrdersCount(placedCount);
      setPendingPaymentCount(pendingCount);
      setPreparingOrdersCount(preparingCount);
      setDineInQueue(dineIn);
      setTakeAwayQueue(takeAway);
    });

    // Listener for best-selling items and revenue today
    const qCompletedOrders = query(
        collection(db, "completed_orders"),
        where("completedAt", ">=", todayStart)
    );
    const unsubCompleted = onSnapshot(qCompletedOrders, (snapshot) => {
        const itemCounts: { [name: string]: number } = {};
        let totalRevenue = 0;

        snapshot.forEach(doc => {
            const order = doc.data() as OrderData;
            totalRevenue += order.total;
            order.items.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
            });
        });
        
        const sortedItems = Object.entries(itemCounts)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 3);
        
        setBestSellingItems(sortedItems);
        setTodaysRevenue(totalRevenue);
    });


    return () => {
      unsubStock();
      unsubOrders();
      unsubCompleted();
    };
  }, []);

  const handleMaximize = (widget: { title: string; content: React.ReactNode }) => {
    setFullscreenWidget(widget);
  };

  const handleCloseFullscreen = () => {
    setFullscreenWidget(null);
  };

  const dashboardWidgets = [
      { 
          title: "Total Pendapatan (Hari Ini)", 
          content: (
              <>
                  <div className="text-2xl font-bold">{formatRupiah(todaysRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Diperbarui secara real-time</p>
              </>
          )
      },
      { 
          title: "Pesanan Baru (Kasir)", 
          content: (
              <>
                  <div className="text-2xl font-bold">{newOrdersCount + pendingPaymentCount}</div>
                  <p className="text-xs text-muted-foreground">{pendingPaymentCount} pesanan menunggu konfirmasi</p>
              </>
          ) 
      },
      { 
          title: "Produk Terlaris (Hari Ini)", 
          content: (
               bestSellingItems.length > 0 ? (
                <ul className="text-sm text-muted-foreground list-decimal list-inside">
                    {bestSellingItems.map(item => (
                        <li key={item.name}>{item.name} <span className="font-bold">({item.quantity} terjual)</span></li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada produk yang terjual hari ini.</p>
              )
          )
      },
      { 
          title: `Stok Menipis (Kurang dari 5)`, 
          content: (
              lowStockItems.length > 0 ? (
                <ul className="text-sm text-red-500 list-disc list-inside">
                    {lowStockItems.map(item => (
                        <li key={item.id}>{item.name} ({item.stock} {item.unit})</li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada item dengan stok menipis.</p>
              )
          )
      },
      { 
          title: "Ringkasan Penjualan", 
          content: <SalesSummaryChart />,
          className: "md:col-span-2 lg:col-span-1"
      },
      { 
          title: "Aktivitas Dapur", 
          content: (
            <div className="space-y-2">
                <div>
                    <p className="text-sm text-muted-foreground">Perlu Disiapkan</p>
                    <p className="text-lg font-bold">{newOrdersCount} Pesanan</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Sedang Disiapkan</p>
                    <p className="text-lg font-bold">{preparingOrdersCount} Pesanan</p>
                </div>
            </div>
          )
      },
       { 
          title: "Antrian Pesanan Aktif", 
          content: (
            <div className="grid grid-cols-2 gap-4 h-full">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Dine In ({dineInQueue.length})</p>
                    <ScrollArea className="h-24 pr-2">
                        <ul className="text-xs space-y-1">
                            {dineInQueue.map(order => (
                                <li key={order.id}>{order.customerName} - Meja {order.tableNumber}</li>
                            ))}
                        </ul>
                    </ScrollArea>
                </div>
                 <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Take Away ({takeAwayQueue.length})</p>
                    <ScrollArea className="h-24 pr-2">
                         <ul className="text-xs space-y-1">
                            {takeAwayQueue.map(order => (
                                <li key={order.id}>{order.customerName} - Take Away</li>
                            ))}
                        </ul>
                    </ScrollArea>
                </div>
            </div>
          )
      }
  ];


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardWidgets.map((widget, index) => (
            <Widget 
                key={index} 
                title={widget.title} 
                onMaximize={() => handleMaximize(widget)}
                className={widget.className}
            >
                {widget.content}
            </Widget>
        ))}
      </div>

      <Dialog open={!!fullscreenWidget} onOpenChange={(isOpen) => !isOpen && handleCloseFullscreen()}>
        <DialogContent className="max-w-4xl h-3/4 flex flex-col p-0">
            {fullscreenWidget && (
                <>
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{fullscreenWidget.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow overflow-auto p-6 pt-0">
                        {fullscreenWidget.content}
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
