
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc, setDoc, deleteDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import type { OrderData, MenuItem, InventoryItem, RecipeItem, MenuItemCategory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useSettings } from '@/context/SettingsContext';
import { CookingPot, Utensils, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity-log';

interface OrderWithId extends OrderData {
    id: string;
}

interface KitchenDisplayProps {
    viewType: 'food' | 'drink';
}

const foodCategories: MenuItemCategory[] = ['Food', 'Desserts'];
const drinkCategories: MenuItemCategory[] = ['Coffee Based', 'Milk Based', 'Juice', 'Mocktail'];

export function KitchenDisplay({ viewType }: KitchenDisplayProps) {
    const { user } = useAuth();
    const [newOrders, setNewOrders] = useState<OrderWithId[]>([]);
    const [preparingOrders, setPreparingOrders] = useState<OrderWithId[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { requestPermission, showNotification } = useNotifications();
    const { playSound } = useSettings();
    const [justArrived, setJustArrived] = useState<Set<string>>(new Set());

    const relevantCategories = viewType === 'food' ? foodCategories : drinkCategories;

    const filterOrderByViewType = useCallback((order: OrderWithId): OrderWithId | null => {
        const relevantItems = order.items.filter(item => {
            const menuItem = menuItems.find(m => m.name === item.name);
            // Check if item belongs to the current view (food/drink) AND has not been marked as prepared by this station.
            const isRelevant = menuItem && relevantCategories.includes(menuItem.category);
            const isAlreadyPrepared = viewType === 'food' ? order.itemsPreparedByKitchen?.includes(item.name) : order.itemsPreparedByBarista?.includes(item.name);
            
            return isRelevant && !isAlreadyPrepared;
        });

        if (relevantItems.length === 0) {
            return null;
        }

        return { ...order, items: relevantItems };
    }, [menuItems, relevantCategories, viewType]);

    useEffect(() => {
        requestPermission();

        const unsubMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
        });

        const qNew = query(collection(db, "orders"), where("status", "==", "Placed"));
        const unsubscribeNew = onSnapshot(qNew, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            orders.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
            setNewOrders(orders);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan baru:", error);
            toast({ title: "Error", description: "Gagal memuat pesanan baru.", variant: "destructive" });
        });

        const qPreparing = query(collection(db, "orders"), where("status", "==", "Preparing"));
        const unsubscribePreparing = onSnapshot(qPreparing, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderWithId));
            orders.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
            setPreparingOrders(orders);
            setIsLoading(false);
        }, (error) => {
            console.error("Gagal mengambil pesanan yang disiapkan:", error);
            toast({ title: "Error", description: "Gagal memuat pesanan yang sedang disiapkan.", variant: "destructive" });
        });

        return () => {
            unsubMenu();
            unsubscribeNew();
            unsubscribePreparing();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to handle notifications and auto-move for new orders
     useEffect(() => {
        if (isLoading || menuItems.length === 0) return;

        const newRelevantOrders = newOrders
            .map(filterOrderByViewType)
            .filter((o): o is OrderWithId => o !== null);
            
        if (newRelevantOrders.length > 0) {
            const latestRelevantOrder = newRelevantOrders[newRelevantOrders.length - 1];
            
            // Check if this order is actually new since the last check to prevent re-triggering
            if (!justArrived.has(latestRelevantOrder.id)) {
                 playSound();
                 showNotification(
                    'Pesanan Baru Masuk!',
                    `Meja ${latestRelevantOrder.tableNumber || 'N/A'} memesan ${latestRelevantOrder.items.length} item.`
                );

                setJustArrived(prev => new Set(prev).add(latestRelevantOrder.id));

                setTimeout(() => {
                    handleStartPreparing(latestRelevantOrder.id, false);
                    setJustArrived(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(latestRelevantOrder.id);
                        return newSet;
                    });
                }, 5000);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newOrders, filterOrderByViewType, isLoading, menuItems]);


    const filteredNewOrders = useMemo(() =>
        newOrders.map(filterOrderByViewType).filter((o): o is OrderWithId => o !== null),
        [newOrders, filterOrderByViewType]
    );

    const filteredPreparingOrders = useMemo(() =>
        preparingOrders.map(filterOrderByViewType).filter((o): o is OrderWithId => o !== null),
        [preparingOrders, filterOrderByViewType]
    );

    const handleStartPreparing = async (orderId: string, manual = true) => {
        const orderRef = doc(db, "orders", orderId);
        try {
            // Only update if the status is 'Placed' to avoid race conditions
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists() && orderSnap.data().status === 'Placed') {
                await updateDoc(orderRef, { status: "Preparing" });
                 if (manual) {
                    logActivity(user, `Mulai menyiapkan pesanan #${orderId}`);
                }
            }
        } catch (error) {
            console.error("Gagal memulai persiapan:", error);
            if (manual) {
              toast({ title: "Error", description: "Gagal memperbarui status pesanan.", variant: "destructive" });
            }
        }
    };
    
    const handleCancelOrder = async (order: OrderWithId) => {
        const orderRef = doc(db, "orders", order.id);
        try {
            if (order.tableNumber) {
                const tableRef = doc(db, "tables", order.tableNumber);
                const tableSnap = await getDoc(tableRef);
                if (tableSnap.exists() && tableSnap.data().currentOrderId === order.id) {
                    await updateDoc(tableRef, {
                        status: 'Available',
                        currentOrderId: null,
                        customerName: null,
                    });
                }
            }
            await deleteDoc(orderRef);
            logActivity(user, `Membatalkan pesanan #${order.id} karena stok habis.`);
            toast({ title: "Pesanan Dibatalkan", description: `Pesanan untuk ${order.customerName} dibatalkan.`, variant: "destructive" });
        } catch (error) {
            console.error("Gagal membatalkan pesanan:", error);
            toast({ title: "Error", description: "Gagal membatalkan pesanan.", variant: "destructive" });
        }
    };
    
    const handleMarkAsReady = async (orderId: string) => {
        const orderRef = doc(db, "orders", orderId);
        
        try {
            await runTransaction(db, async (transaction) => {
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) throw new Error("Pesanan tidak ditemukan!");
                
                const orderData = orderSnap.data() as OrderData;
                const itemsForThisStation = orderData.items.filter(item => {
                    const menuItem = menuItems.find(m => m.name === item.name);
                    return menuItem && relevantCategories.includes(menuItem.category);
                }).map(item => item.name);

                // --- 1. Stock Deduction Logic ---
                const ingredientQuantities: Map<string, number> = new Map();
                for (const itemName of itemsForThisStation) {
                    const orderedItem = orderData.items.find(i => i.name === itemName);
                    const menuItem = menuItems.find(m => m.name === itemName);
                    if (orderedItem && menuItem?.recipe) {
                        for (const recipeItem of menuItem.recipe) {
                            const currentQuantity = ingredientQuantities.get(recipeItem.ingredientId) || 0;
                            ingredientQuantities.set(recipeItem.ingredientId, currentQuantity + (recipeItem.quantity * orderedItem.quantity));
                        }
                    }
                }

                const inventoryReads = Array.from(ingredientQuantities.keys()).map(id => transaction.get(doc(db, "gudang", id)));
                const inventorySnaps = await Promise.all(inventoryReads);

                inventorySnaps.forEach((invSnap, index) => {
                    const ingredientId = Array.from(ingredientQuantities.keys())[index];
                    const quantityToDeduct = ingredientQuantities.get(ingredientId);
                    if (invSnap.exists() && quantityToDeduct) {
                        transaction.update(invSnap.ref, { stock: invSnap.data().stock - quantityToDeduct });
                    }
                });

                // --- 2. Order Status Update Logic ---
                const updateData: Partial<OrderData> = {};
                const preparedByKitchen = new Set(orderData.itemsPreparedByKitchen || []);
                const preparedByBarista = new Set(orderData.itemsPreparedByBarista || []);

                if (viewType === 'food') {
                    itemsForThisStation.forEach(name => preparedByKitchen.add(name));
                    updateData.itemsPreparedByKitchen = Array.from(preparedByKitchen);
                } else {
                    itemsForThisStation.forEach(name => preparedByBarista.add(name));
                    updateData.itemsPreparedByBarista = Array.from(preparedByBarista);
                }
                
                const allItems = new Set(orderData.items.map(i => i.name));
                const allPrepared = Array.from(allItems).every(name => preparedByKitchen.has(name) || preparedByBarista.has(name));

                if (allPrepared) {
                    updateData.status = "Served";
                }
                
                transaction.update(orderRef, updateData);
            });

            logActivity(user, `Menandai item di pesanan #${orderId} sebagai siap.`);
            toast({ title: "Sukses", description: "Item ditandai siap dan stok telah diperbarui." });

        } catch (error) {
            console.error("Gagal menyelesaikan pesanan:", error);
            toast({ title: "Error", description: `Gagal memproses penyelesaian pesanan: ${error}`, variant: "destructive" });
        }
    };

    const renderOrderCard = (order: OrderWithId, isNew: boolean) => {
        const isBlinking = isNew && justArrived.has(order.id);
        return (
            <Card key={order.id} className={`mb-4 shadow-md ${isBlinking ? 'border-2 border-primary animate-pulse-once' : ''}`}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>{order.tableNumber ? `Meja ${order.tableNumber.replace('meja ', '')}` : 'Take Away'}</span>
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
                <CardFooter className="flex gap-2">
                     {isNew ? (
                        <>
                            <Button onClick={() => handleCancelOrder(order)} variant="destructive" className="w-1/3">
                                <XCircle className="mr-2 h-4 w-4" /> Batal
                            </Button>
                            <Button onClick={() => handleStartPreparing(order.id)} className="w-2/3">
                                <CookingPot className="mr-2 h-4 w-4" /> Mulai Siapkan
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => handleMarkAsReady(order.id)} className="w-full">
                            <CheckCircle className="mr-2 h-4 w-4" /> Sudah Siap
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Utensils /> Pesanan Baru ({filteredNewOrders.length})</h2>
                <div className="bg-muted/50 p-4 rounded-lg h-[75vh] overflow-y-auto">
                    {isLoading ? <p>Memuat pesanan...</p> : 
                     filteredNewOrders.length > 0 ? filteredNewOrders.map(order => renderOrderCard(order, true)) : <p>Tidak ada pesanan baru.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CookingPot /> Sedang Disiapkan ({filteredPreparingOrders.length})</h2>
                <div className="bg-muted/50 p-4 rounded-lg h-[75vh] overflow-y-auto">
                    {isLoading ? <p>Memuat pesanan...</p> :
                     filteredPreparingOrders.length > 0 ? filteredPreparingOrders.map(order => renderOrderCard(order, false)) : <p>Tidak ada pesanan yang sedang disiapkan.</p>}
                </div>
            </div>
        </div>
    );
}
