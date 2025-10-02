"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ExpensesManagement } from '@/components/admin/ExpensesManagement';
import { withAuth } from '@/context/AuthContext';

function ExpensesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Manajemen Beban" />
      <main className="container mx-auto px-4 py-8">
        <ExpensesManagement />
      </main>
    </div>
  );
}

export default withAuth(ExpensesPage);
