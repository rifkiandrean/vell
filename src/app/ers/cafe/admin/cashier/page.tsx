
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { CashierDisplay } from '@/components/cashier/CashierDisplay';
import { withAuth } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import { CafeFooter } from '@/components/CafeFooter';

function CashierPage() {
  return (
    <OrderProvider>
      <div className="flex flex-col min-h-screen">
        <AdminHeader title="Kasir" showCashierLink={true} showCashierName={true} />
        <main className="flex-1 p-4 lg:p-6">
          <CashierDisplay />
        </main>
        <CafeFooter />
      </div>
    </OrderProvider>
  );
}

export default withAuth(CashierPage);
