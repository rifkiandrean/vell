
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { MenuManagement } from '@/components/admin/MenuManagement';
import { withAuth } from '@/context/AuthContext';

function MenuPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Manajemen Menu" />
      <main className="container mx-auto px-4 py-8">
        <MenuManagement />
      </main>
    </div>
  );
}

export default withAuth(MenuPage);
