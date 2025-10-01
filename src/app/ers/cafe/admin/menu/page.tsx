
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { MenuManagement } from '@/components/admin/MenuManagement';
import { withAuth } from '@/context/AuthContext';

function MenuPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Manajemen Menu</h2>
        <MenuManagement />
      </main>
    </div>
  );
}

export default withAuth(MenuPage);
