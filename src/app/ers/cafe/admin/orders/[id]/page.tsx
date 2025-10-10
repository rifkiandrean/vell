
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { POForm } from '@/components/admin/POForm';
import { withAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

function EditPOPage() {
  const params = useParams();
  const { id } = params;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title={`Detail PO #${id as string}`} />
      <main className="container mx-auto px-4 py-8">
        <POForm poId={id as string} />
      </main>
    </div>
  );
}

export default withAuth(EditPOPage);
