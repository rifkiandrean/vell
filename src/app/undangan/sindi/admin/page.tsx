'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SindiAdminDashboard } from '@/components/SindiAdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function SindiAdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);


  // Show a loading state while we check for the user.
  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
        <p>Memeriksa status login...</p>
      </div>
    );
  }
  
  // If user is logged in, show the dashboard.
  return <SindiAdminDashboard />;
}
