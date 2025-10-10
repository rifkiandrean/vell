
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { FoodCostDisplay } from '@/components/admin/FoodCostDisplay';
import { withAuth } from '@/context/AuthContext';

function FoodCostPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader title="Analisis Food Cost" />
      <main className="container mx-auto px-4 py-8">
        <FoodCostDisplay />
      </main>
    </div>
  );
}

export default withAuth(FoodCostPage);
