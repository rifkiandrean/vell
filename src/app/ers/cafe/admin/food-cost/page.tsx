
"use client";

import { AdminHeader } from '@/components/admin/AdminHeader';
import { FoodCostDisplay } from '@/components/admin/FoodCostDisplay';
import { withAuth } from '@/context/AuthContext';

function FoodCostPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Analisis Food Cost</h2>
        <FoodCostDisplay />
      </main>
    </div>
  );
}

export default withAuth(FoodCostPage);
