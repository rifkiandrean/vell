

"use client";

import type { ReactNode } from 'react';
import * as React from 'react';
import { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, query, where, getDocs, limit, updateDoc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { OrderItem, OrderStatus, MenuItem, Spiciness, SugarLevel, Topping, OrderData, TableData, TaxSettings, PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { QRScanner } from '@/components/order/QRScanner';
import { format } from 'date-fns';

type OrderState = {
  orderItems: OrderItem[];
  orderId?: string; // To track the current order
  orderStatus: OrderStatus;
  orderProgress: number;
  tableNumber?: string;
  customerName: string;
  whatsappNumber: string;
  isProcessingOrder: boolean;
  createdAt?: Date | null;
};

type OrderAction =
  | { type: 'ADD_ITEM'; item: OrderItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'START_ORDER'; payload: {orderId: string; status: OrderStatus; progress: number, createdAt: Date | null} }
  | { type: 'RESET_ORDER' }
  | { type: 'SET_STATUS'; payload: {status: OrderStatus; progress: number, createdAt: Date | null} }
  | { type: 'SET_TABLE_NUMBER'; tableNumber?: string }
  | { type: 'SET_CUSTOMER_DETAILS'; payload: { customerName?: string; whatsappNumber?: string } }
  | { type: 'SET_PROCESSING_ORDER'; payload: boolean };

const initialState: OrderState = {
  orderItems: [],
  orderId: undefined,
  orderStatus: 'Idle',
  orderProgress: 0,
  tableNumber: undefined,
  customerName: '',
  whatsappNumber: '',
  isProcessingOrder: false,
  createdAt: null,
};

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, orderItems: [...state.orderItems, action.item] };
    case 'REMOVE_ITEM':
      return { ...state, orderItems: state.orderItems.filter(item => item.id !== action.itemId) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        orderItems: state.orderItems.map(item =>
          item.id === action.itemId
            ? {
                ...item,
                quantity: action.quantity,
                totalPrice: (item.menuItem.price + (item.customizations.toppings || []).reduce((sum, t) => sum + t.price, 0)) * action.quantity,
              }
            : item
        ),
      };
    case 'START_ORDER':
      return { ...state, orderItems: [], orderId: action.payload.orderId, orderStatus: action.payload.status, orderProgress: action.payload.progress, createdAt: action.payload.createdAt, customerName: '', whatsappNumber: '' };
    case 'RESET_ORDER':
        // Keep table number if it exists, reset the rest
        return { ...initialState, tableNumber: state.tableNumber, customerName: '', whatsappNumber: '' };
    case 'SET_STATUS':
      // Avoid re-rendering if status is the same
      if (state.orderStatus === action.payload.status && state.orderProgress === action.payload.progress) {
        return state;
      }
      return { ...state, orderStatus: action.payload.status, orderProgress: action.payload.progress, createdAt: action.payload.createdAt };
    case 'SET_TABLE_NUMBER':
      return { ...state, tableNumber: action.tableNumber };
    case 'SET_CUSTOMER_DETAILS': {
        const newState = { ...state, ...action.payload };
        // Allow only numbers for whatsappNumber
        if (action.payload.whatsappNumber !== undefined) {
            newState.whatsappNumber = action.payload.whatsappNumber.replace(/\D/g, '');
        }
        return newState;
    }
    case 'SET_PROCESSING_ORDER':
      return { ...state, isProcessingOrder: action.payload };
    default:
      return state;
  }
};

type OrderContextType = {
  orderItems: OrderItem[];
  orderId?: string;
  orderStatus: OrderStatus;
  orderProgress: number;
  subtotal: number;
  ppnAmount: number;
  serviceChargeAmount: number;
  totalPrice: number;
  tableNumber?: string;
  customerName: string;
  whatsappNumber: string;
  isProcessingOrder: boolean;
  createdAt: Date | null;
  setTableNumber: (tableNumber?: string) => void;
  setCustomerDetails: (details: { customerName?: string, whatsappNumber?: string }) => void;
  addToOrder: (menuItem: MenuItem, quantity: number, customizations: { spiciness?: Spiciness; sugarLevel?: SugarLevel; toppings?: Topping[] }) => void;
  removeFromOrder: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  initiateOrder: () => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Define a type for the item pending merge
type PendingItem = {
    menuItem: MenuItem;
    quantity: number;
    customizations: { spiciness?: Spiciness; sugarLevel?: SugarLevel; toppings?: Topping[] };
};

async function generateNewBillId() {
    const today = new Date();
    const dateSuffix = format(today, 'ddMMyyyy');
    const prefix = `BILL`;

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Query for orders created today to find the count
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("createdAt", ">=", startOfDay), where("createdAt", "<=", endOfDay));
    
    const querySnapshot = await getDocs(q);
    const todayCount = querySnapshot.size;

    const newSequence = (todayCount + 1).toString().padStart(3, '0');
    return `${prefix}${newSequence}${dateSuffix}`;
}

function OrderProviderContent({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showQRAlert, setShowQRAlert] = useState(false);
  const [showScannerDialog, setShowScannerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTableTakenAlert, setShowTableTakenAlert] = useState(false);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({ ppn: 0, serviceCharge: 0 });

  // State for merging orders
  const [showMergeOrderDialog, setShowMergeOrderDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  
  useEffect(() => {
    // Fetch tax settings
    const unsubTax = onSnapshot(doc(db, "settings", "taxSettings"), (docSnap) => {
        if (docSnap.exists()) {
            setTaxSettings(docSnap.data() as TaxSettings);
        } else {
            setTaxSettings({ ppn: 0, serviceCharge: 0 });
        }
    });

    return () => unsubTax();
  }, []);

 useEffect(() => {
    const tableParam = searchParams.get('meja');
    const currentPath = window.location.pathname;

    const checkTableStatus = async (tableIdFromParam: string) => {
      const tableId = tableIdFromParam.match(/^\d+$/) ? `meja ${tableIdFromParam}` : tableIdFromParam;
      
      // Prevent re-checking if we are already on this table with an active order.
      if (state.tableNumber === tableId && state.orderId) {
        return;
      }
      
      const tableRef = doc(db, "tables", tableId);
      const tableSnap = await getDoc(tableRef);

      if (!tableSnap.exists()) {
          setShowTableTakenAlert(true);
          return;
      }
      
      const tableData = tableSnap.data() as TableData;

      // Handle different table statuses
      switch (tableData.status) {
        case 'Available':
          // Table is free, start a new order.
          dispatch({ type: 'RESET_ORDER' });
          dispatch({ type: 'SET_TABLE_NUMBER', tableNumber: tableId });
           if (currentPath === '/ers/cafe') { // Only show toast on the main cafe page
            toast({
              title: `Selamat Datang di ${tableId}`,
              description: "Silakan pilih menu yang Anda inginkan.",
            });
          }
          break;
        case 'Occupied':
          // Table is occupied, track the existing order.
          if (tableData.currentOrderId) {
            const orderRef = doc(db, "orders", tableData.currentOrderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
              const orderData = orderSnap.data() as OrderData;
              // Reset local state completely before starting to track the new order
              dispatch({ type: 'RESET_ORDER' }); 
              dispatch({ type: 'SET_TABLE_NUMBER', tableNumber: tableId });
              dispatch({ type: 'START_ORDER', payload: {orderId: tableData.currentOrderId, status: orderData.status, progress: 0, createdAt: orderData.createdAt?.toDate() || null } });
            } else {
              // Edge case: Table is occupied but order doc is missing. Treat as unavailable.
              setShowTableTakenAlert(true);
            }
          } else {
            // Edge case: Table is occupied but no order ID. Treat as unavailable.
            setShowTableTakenAlert(true);
          }
          break;
        case 'Needs Cleanup':
        case 'Unavailable':
        default:
          // Table is not available for new customers.
          setShowTableTakenAlert(true);
          break;
      }
    };

    if (tableParam) {
        checkTableStatus(tableParam);
        // Close any open dialogs.
        setShowQRAlert(false);
        setShowScannerDialog(false);
    } else if (currentPath === '/ers/cafe' && !state.tableNumber && !state.orderId) {
        // If on the exact cafe page without a table number, prompt to scan QR.
        setShowQRAlert(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  useEffect(() => {
    if (!state.orderId) return;

    const unsubscribe = onSnapshot(doc(db, "orders", state.orderId), (docSnap) => {
        if (docSnap.exists()) {
            const orderData = docSnap.data() as OrderData;
            const status = orderData.status;
            let progress = 0;
            switch(status) {
                case 'Pending Payment': progress = 10; break;
                case 'Placed': progress = 25; break;
                case 'Preparing': progress = 50; break;
                case 'Served': progress = 75; break;
                case 'Delivered': progress = 100; break;
            }
            dispatch({ type: 'SET_STATUS', payload: {status, progress, createdAt: orderData.createdAt?.toDate() || null} });
        } else {
            // Document was deleted, which means it was delivered and archived.
            if (state.orderStatus !== 'Delivered') {
                dispatch({ type: 'SET_STATUS', payload: { status: 'Delivered', progress: 100, createdAt: state.createdAt } });
                 toast({ title: 'Pesanan Selesai!', description: 'Terima kasih telah memesan. Selamat menikmati!' });
                setTimeout(() => {
                  dispatch({ type: 'RESET_ORDER' });
                }, 5000);
            }
        }
    });

    return () => unsubscribe();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.orderId, toast]);

  const handleScanSuccess = (decodedText: string) => {
    setShowScannerDialog(false);
    toast({ title: "Scan Berhasil!", description: "Memeriksa ketersediaan meja..." });
    
    try {
      const url = new URL(decodedText);
      const table = url.searchParams.get('meja');
      if (table) {
        router.push(`/ers/cafe?meja=${table}`);
      } else {
        throw new Error();
      }
    } catch (error) {
      router.push(`/ers/cafe?meja=${decodedText}`);
    }
  };

  const handleMergeOrder = async () => {
    if (!pendingItem || !state.orderId) return;

    const { menuItem, quantity, customizations } = pendingItem;
    setShowMergeOrderDialog(false);
    setPendingItem(null);
    dispatch({ type: 'SET_PROCESSING_ORDER', payload: true });

    const orderRef = doc(db, "orders", state.orderId);

    try {
        await runTransaction(db, async (transaction) => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("Pesanan yang ada tidak ditemukan!");
            }

            const existingOrder = orderSnap.data() as OrderData;
            
            // Calculate new item price
            const toppingsPrice = (customizations.toppings || []).reduce((sum, topping) => sum + topping.price, 0);
            const singleItemPrice = menuItem.price + toppingsPrice;
            const newItemTotalPrice = singleItemPrice * quantity;

            const newOrderItem: OrderData['items'][0] = {
                name: menuItem.name,
                quantity: quantity,
                price: newItemTotalPrice,
                customizations: {
                    spiciness: customizations.spiciness || null,
                    sugarLevel: customizations.sugarLevel || null,
                    toppings: (customizations.toppings || []).map(t => t.name).join(', ')
                }
            };
            
            // Calculate new totals
            const newSubtotal = existingOrder.subtotal + newItemTotalPrice;
            const newPpnAmount = newSubtotal * (taxSettings.ppn / 100);
            const newServiceChargeAmount = newSubtotal * (taxSettings.serviceCharge / 100);
            const newTotal = newSubtotal + newPpnAmount + newServiceChargeAmount;

            transaction.update(orderRef, {
                items: [...existingOrder.items, newOrderItem],
                subtotal: newSubtotal,
                ppnAmount: newPpnAmount,
                serviceChargeAmount: newServiceChargeAmount,
                total: newTotal
            });
        });

        toast({ title: 'Item Ditambahkan', description: `${menuItem.name} berhasil ditambahkan ke pesanan Anda.` });
    } catch (error: any) {
        console.error("Gagal menggabungkan pesanan:", error);
        toast({ title: "Gagal Menambahkan Item", description: error.message, variant: "destructive" });
    } finally {
        dispatch({ type: 'SET_PROCESSING_ORDER', payload: false });
    }
  };


  const addToOrder = useCallback((menuItem: MenuItem, quantity: number, customizations: { spiciness?: Spiciness; sugarLevel?: SugarLevel; toppings?: Topping[] }) => {
    // If there's an active order, ask to merge.
    if (state.orderId) {
        setPendingItem({ menuItem, quantity, customizations });
        setShowMergeOrderDialog(true);
        return;
    }

    const toppingsPrice = (customizations.toppings || []).reduce((sum, topping) => sum + topping.price, 0);
    const singleItemPrice = menuItem.price + toppingsPrice;
    const totalPrice = singleItemPrice * quantity;

    const newOrderItem: OrderItem = {
      id: `${menuItem.id}-${Date.now()}`,
      menuItem,
      quantity,
      customizations: {
        ...customizations,
        toppings: customizations.toppings || []
      },
      totalPrice,
    };
    dispatch({ type: 'ADD_ITEM', item: newOrderItem });
    toast({ title: 'Item Ditambahkan', description: `${menuItem.name} telah ditambahkan ke keranjang Anda.` });
  }, [state.orderId, toast]);

  const removeFromOrder = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', itemId });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity });
    }
  }, []);
  
  const setTableNumber = useCallback((tableNumber?: string) => {
    dispatch({ type: 'SET_TABLE_NUMBER', tableNumber });
  }, []);

  const setCustomerDetails = useCallback((details: { customerName?: string, whatsappNumber?: string }) => {
    dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: details });
  }, []);

  const initiateOrder = useCallback(() => {
    const isCashier = window.location.pathname.startsWith('/ers/cafe/admin/cashier');
    if (state.orderItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Pesanan Kosong',
        description: 'Silakan tambahkan item ke pesanan Anda sebelum melanjutkan.',
      });
      return;
    }
    if (!state.tableNumber && !isCashier) {
        toast({
            variant: 'destructive',
            title: 'Nomor Meja Kosong',
            description: 'Silakan pindai kode QR di meja Anda terlebih dahulu.',
        });
        return;
    }
    if (!state.customerName) {
        toast({
          variant: 'destructive',
          title: 'Informasi Kurang',
          description: 'Harap isi nama pembeli.',
        });
        return;
    }
    if (!state.whatsappNumber && !isCashier) {
        toast({
          variant: 'destructive',
          title: 'Informasi Kurang',
          description: 'Harap isi nomor WhatsApp.',
        });
        return;
    }
    setShowPaymentDialog(true);
  }, [state.orderItems, state.customerName, state.whatsappNumber, state.tableNumber, toast]);

  const { subtotal, ppnAmount, serviceChargeAmount, totalPrice } = useMemo(() => {
    const sub = state.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const ppn = sub * (taxSettings.ppn / 100);
    const service = sub * (taxSettings.serviceCharge / 100);
    const total = sub + ppn + service;
    return { subtotal: sub, ppnAmount: ppn, serviceChargeAmount: service, totalPrice: total };
  }, [state.orderItems, taxSettings]);

  const handleConfirmOrder = useCallback(async (paymentMethod: PaymentMethod) => {
    setShowPaymentDialog(false);
    dispatch({ type: 'SET_PROCESSING_ORDER', payload: true });

    try {
      const isOnlinePayment = paymentMethod === 'Online';
      const initialStatus: OrderStatus = isOnlinePayment ? 'Placed' : 'Pending Payment';
      const initialProgress = isOnlinePayment ? 25 : 10;
      
      const newBillId = await generateNewBillId();

      const orderToSave: Omit<OrderData, 'id'> = {
        items: state.orderItems.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.totalPrice,
          customizations: {
            spiciness: item.customizations.spiciness || null,
            sugarLevel: item.customizations.sugarLevel || null,
            toppings: (item.customizations.toppings || []).map(t => t.name).join(', ')
          }
        })),
        subtotal: subtotal,
        ppnAmount: ppnAmount,
        serviceChargeAmount: serviceChargeAmount,
        total: totalPrice,
        status: initialStatus,
        createdAt: serverTimestamp(),
        tableNumber: state.tableNumber || null,
        customerName: state.customerName,
        whatsappNumber: state.whatsappNumber,
        paymentMethod: paymentMethod,
      };
      
      const docRef = doc(db, "orders", newBillId);
      await setDoc(docRef, orderToSave);
      
      // Update table status to 'Occupied'
      if(state.tableNumber) {
        const tableRef = doc(db, "tables", state.tableNumber);
        await updateDoc(tableRef, {
            status: "Occupied",
            currentOrderId: newBillId,
            customerName: state.customerName,
            lastActivity: serverTimestamp()
        });
      }


      dispatch({ type: 'START_ORDER', payload: {orderId: newBillId, status: initialStatus, progress: initialProgress, createdAt: new Date() } });
      toast({
        title: 'Pesanan Dibuat!',
        description: initialStatus === 'Placed' ? 'Terima kasih! Pesanan Anda sedang diproses.' : 'Pesanan menunggu pembayaran di kasir.',
      });

    } catch (error) {
       console.error("Error writing document: ", error);
       toast({
        variant: 'destructive',
        title: 'Gagal Membuat Pesanan',
        description: 'Terjadi masalah saat membuat pesanan Anda. Silakan coba lagi.',
      });
    } finally {
      dispatch({ type: 'SET_PROCESSING_ORDER', payload: false });
    }
  }, [state.orderItems, state.tableNumber, state.customerName, state.whatsappNumber, subtotal, ppnAmount, serviceChargeAmount, totalPrice, toast]);

  const value = {
    orderItems: state.orderItems,
    orderId: state.orderId,
    orderStatus: state.orderStatus,
    orderProgress: state.orderProgress,
    subtotal,
    ppnAmount,
    serviceChargeAmount,
    totalPrice,
    tableNumber: state.tableNumber,
    customerName: state.customerName,
    whatsappNumber: state.whatsappNumber,
    isProcessingOrder: state.isProcessingOrder,
    createdAt: state.createdAt || null,
    setTableNumber,
    setCustomerDetails,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    initiateOrder,
  };

  return (
    <OrderContext.Provider value={value}>
        {children}
        <AlertDialog open={showQRAlert && !showScannerDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Selamat Datang di BADIA KOPI!</AlertDialogTitle>
                <AlertDialogDescription>
                    Untuk memesan, silakan pindai (scan) kode QR yang tersedia di meja Anda.
                </AlertDialogDescription>
                </AlertDialogHeader>
                 <AlertDialogFooter>
                    <Button className="w-full" onClick={() => setShowScannerDialog(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Scan QR Code
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showTableTakenAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Meja Tidak Tersedia</AlertDialogTitle>
                    <AlertDialogDescription>
                        Meja ini sedang digunakan atau perlu dibersihkan. Mohon pindai meja lain atau hubungi staf kami untuk bantuan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                 <AlertDialogFooter>
                    <Button className="w-full" onClick={() => {
                        setShowTableTakenAlert(false);
                        setShowScannerDialog(true);
                    }}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Pindai Meja Lain
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showScannerDialog} onOpenChange={setShowScannerDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pindai Kode QR Meja</DialogTitle>
                    <DialogDescription>
                        Posisikan kamera Anda ke kode QR yang ada di meja.
                    </DialogDescription>
                </DialogHeader>
                <QRScanner 
                    onScanSuccess={handleScanSuccess} 
                    onScanError={(error) => console.log('QR Scan Error:', error)}
                />
            </DialogContent>
        </Dialog>
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
                    <DialogDescription>
                        Pilih cara Anda untuk membayar pesanan ini.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                    <Button size="lg" variant="outline" onClick={() => handleConfirmOrder('Cash')}>
                        <Wallet className="mr-2 h-5 w-5" />
                        Bayar di Kasir (Cash)
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => handleConfirmOrder('Transfer')}>
                        <Smartphone className="mr-2 h-5 w-5" />
                        Transfer Bank
                    </Button>
                    <Button size="lg" disabled>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pembayaran Online (Segera Hadir)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        <AlertDialog open={showMergeOrderDialog} onOpenChange={setShowMergeOrderDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tambahkan ke Pesanan Aktif?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Anda sudah memiliki pesanan aktif dengan ID: <span className="font-bold font-mono">{state.orderId}</span>.
                        <br/><br/>
                        Apakah Anda ingin menambahkan <span className="font-bold">{pendingItem?.quantity}x {pendingItem?.menuItem.name}</span> ke pesanan ini?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPendingItem(null)}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMergeOrder}>Ya, Tambahkan</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </OrderContext.Provider>
  );
};


export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a static version or a loading indicator on the server
    return <div className="flex flex-col min-h-screen bg-muted/40">{children}</div>;
  }
  
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <OrderProviderContent>{children}</OrderProviderContent>
    </React.Suspense>
  )
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
