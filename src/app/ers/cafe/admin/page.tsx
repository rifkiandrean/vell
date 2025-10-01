
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { DashboardDisplay } from '@/components/admin/DashboardDisplay';
import { withAuth } from '@/context/AuthContext';

function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h2>
        <DashboardDisplay />
      </main>
    </div>
  );
}

export default withAuth(AdminDashboardPage);
