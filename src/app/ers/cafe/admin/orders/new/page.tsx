
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { POForm } from '@/components/admin/POForm';
import { withAuth } from '@/context/AuthContext';

function NewPOPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <POForm />
      </main>
    </div>
  );
}

export default withAuth(NewPOPage);
