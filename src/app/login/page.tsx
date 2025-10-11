'use client';

import { useUser } from '@/firebase';
import { AuthForm } from '@/components/AuthForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const handleLoginSuccess = () => {
        router.push('/undangan/sindi/admin');
    };

    useEffect(() => {
        // If user is already logged in, redirect them to the admin dashboard.
        if (!isUserLoading && user) {
            handleLoginSuccess();
        }
    }, [user, isUserLoading]);

    // Show a loading indicator while checking auth status or if a logged-in user is being redirected
    if (isUserLoading || user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-10 w-full max-w-md" />
                <p>Memeriksa status login dan mengalihkan...</p>
            </div>
        );
    }
    
    // If there's no user and loading is complete, show the login form.
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-4">
                <AuthForm onLoginSuccess={handleLoginSuccess} />
            </div>
        </div>
    );
}
