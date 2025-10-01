
"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc, setDoc, deleteDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import type { OrderData, MenuItem, InventoryItem, RecipeItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useSettings } from '@/context/SettingsContext';
import { CookingPot, Utensils, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

interface OrderWithId extends OrderData {
    id: string;
}

export function KitchenDisplay() {
    const { user } = useAuth();
    const [newOrders, setNewOrders] = useState<OrderWithId[]>([]);
    const [preparingOrders, setPreparingOrders] = useState<OrderWithId[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const prevNewOrderCountRef = useRef(0);
    const { requestPermission, showNotification } = useNotifications();
    const { playSound } = useSettings();

    useEffect(() => {
        requestPermission();

        // Fetch Menu and Inventory for recipe and stock lookups
        const unsubMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
        });
        const unsubInventory = onSnapshot(collection(db, 'gudang'), (snapshot) => {
            setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
        });

        const qNew = query(collection(db, "orders"), where("status", "==", "Placed"));
        const unsubscribeNew = onSnapshot(qNew, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            orders.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
            
            if (!isLoading && orders.length > prevNewOrderCountRef.current) {
                playSound();
                const newOrder = orders[orders.length - 1]; // Assuming newest is last
                if(newOrder) {
                    showNotification(
                        'Pesanan Baru Masuk!',
                        `Meja ${newOrder.tableNumber || 'N/A'} memesan ${newOrder.items.length} item.`
                    );
                }
            }
            
            setNewOrders(orders);
            prevNewOrderCountRef.current = orders.length;
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan baru:", error);
            toast({
                title: "Error",
                description: "Gagal memuat pesanan baru.",
                variant: "destructive"
            });
        });

        const qPreparing = query(collection(db, "orders"), where("status", "==", "Preparing"));
        const unsubscribePreparing = onSnapshot(qPreparing, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            orders.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
            setPreparingOrders(orders);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan yang disiapkan:", error);
            toast({
                title: "Error",
                description: "Gagal memuat pesanan yang sedang disiapkan.",
                variant: "destructive"
            });
        });

        return () => {
            unsubMenu();
            unsubInventory();
            unsubscribeNew();
            unsubscribePreparing();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, toast, requestPermission, showNotification, playSound]);

    const handleStartPreparing = async (orderId: string) => {
        const orderRef = doc(db, "orders", orderId);
        try {
            await updateDoc(orderRef, { status: "Preparing" });
            logActivity(user, `Mulai menyiapkan pesanan #${orderId}`);
        } catch (error) {
            console.error("Gagal memulai persiapan:", error);
            toast({ title: "Error", description: "Gagal memperbarui status pesanan.", variant: "destructive" });
        }
    };
    
    const handleMarkAsReady = async (orderId: string) => {
        const orderRef = doc(db, "orders", orderId);
        
        try {
            await runTransaction(db, async (transaction) => {
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) {
                    throw new Error("Pesanan tidak ditemukan!");
                }
                const orderData = orderSnap.data() as OrderData;

                // 1. Aggregate all ingredients and quantities needed
                const ingredientQuantities: Map<string, number> = new Map();
                for (const orderedItem of orderData.items) {
                    const menuItem = menuItems.find(m => m.name === orderedItem.name);
                    if (menuItem && menuItem.recipe) {
                        for (const recipeItem of menuItem.recipe) {
                            const currentQuantity = ingredientQuantities.get(recipeItem.ingredientId) || 0;
                            const quantityToDeduct = recipeItem.quantity * orderedItem.quantity;
                            ingredientQuantities.set(recipeItem.ingredientId, currentQuantity + quantityToDeduct);
                        }
                    }
                }

                // 2. Perform all reads first
                const inventoryReads = Array.from(ingredientQuantities.keys()).map(ingredientId => {
                    const inventoryDocRef = doc(db, "gudang", ingredientId);
                    return transaction.get(inventoryDocRef);
                });

                const inventorySnaps = await Promise.all(inventoryReads);

                // 3. Now perform all writes
                inventorySnaps.forEach((inventorySnap, index) => {
                     const ingredientId = Array.from(ingredientQuantities.keys())[index];
                     const quantityToDeduct = ingredientQuantities.get(ingredientId);

                     if (inventorySnap.exists() && quantityToDeduct) {
                         const currentStock = inventorySnap.data().stock;
                         const newStock = currentStock - quantityToDeduct;
                         transaction.update(inventorySnap.ref, { stock: newStock });
                     } else {
                         console.warn(`Item gudang dengan ID ${ingredientId} tidak ditemukan.`);
                     }
                });
                
                // Finally, update the order status
                transaction.update(orderRef, { status: "Served" });
            });
            logActivity(user, `Menandai pesanan #${orderId} sebagai siap diantar.`);
            toast({ title: "Sukses", description: "Pesanan ditandai sebagai siap dan stok telah diperbarui." });

        } catch (error) {
            console.error("Gagal menyelesaikan pesanan:", error);
            toast({ title: "Error", description: `Gagal memproses penyelesaian pesanan: ${error}`, variant: "destructive" });
        }
    };

    const renderOrderCard = (order: OrderWithId, isNew: boolean) => (
        <Card key={order.id} className="mb-4 shadow-md">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Meja: {order.tableNumber || 'N/A'}</span>
                    <span className="text-sm font-medium text-muted-foreground">{order.customerName}</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono pt-1">{order.id}</p>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                            <div>
                                <span className="font-semibold">{item.quantity}x {item.name}</span>
                                { (item.customizations?.sugarLevel || item.customizations?.toppings) &&
                                    <p className="text-xs text-muted-foreground">
                                        {[item.customizations.sugarLevel, item.customizations.toppings].filter(Boolean).join(', ')}
                                    </p>
                                }
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                 {isNew ? (
                    <Button onClick={() => handleStartPreparing(order.id)} className="w-full">
                        <CookingPot className="mr-2 h-4 w-4" /> Mulai Siapkan
                    </Button>
                ) : (
                    <Button onClick={() => handleMarkAsReady(order.id)} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="mr-2 h-4 w-4" /> Sudah Siap
                    </Button>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Utensils /> Pesanan Baru</h2>
                <div className="bg-muted/50 p-4 rounded-lg h-[75vh] overflow-y-auto">
                    {isLoading ? <p>Memuat pesanan...</p> : 
                     newOrders.length > 0 ? newOrders.map(order => renderOrderCard(order, true)) : <p>Tidak ada pesanan baru.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CookingPot /> Sedang Disiapkan</h2>
                <div className="bg-muted/50 p-4 rounded-lg h-[75vh] overflow-y-auto">
                    {isLoading ? <p>Memuat pesanan...</p> :
                     preparingOrders.length > 0 ? preparingOrders.map(order => renderOrderCard(order, false)) : <p>Tidak ada pesanan yang sedang disiapkan.</p>}
                </div>
            </div>
        </div>
    );
}
