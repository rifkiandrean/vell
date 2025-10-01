
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReportsDisplay } from '@/components/admin/ReportsDisplay';
import { withAuth } from '@/context/AuthContext';

function ReportsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Laporan Keuangan</h2>
        <ReportsDisplay />
      </main>
    </div>
  );
}

export default withAuth(ReportsPage);
