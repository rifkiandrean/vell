

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  createUser: (email: string, password: string, displayName: string, role: string) => Promise<void>;
  transformGoogleDriveUrl: (url: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const transformGoogleDriveUrl = (url: string): string => {
    return url;
  }
  
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const createUser = async (email: string, password: string, displayName: string, role: string) => {
    const functions = getFunctions();
    const setUserRole = httpsCallable(functions, 'setUserRole');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    console.log(`User ${displayName} created with email ${email} and role ${role}. In a real app, a Cloud Function would set the custom claim.`);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
        unsubAuth();
    };
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    createUser,
    transformGoogleDriveUrl
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
    const WithAuthComponent = (props: P) => {
        const { user, loading } = useAuth();
        const router = useRouter();
        const pathname = usePathname();

        useEffect(() => {
            if (loading) return;

            const isAdminPath = pathname.startsWith('/sindi/admin');
            const isLoginPath = pathname.endsWith('/login');

            if (!user && isAdminPath && !isLoginPath) {
                router.replace(`/sindi/admin/login`);
            }
        }, [user, loading, router, pathname]);

        if (loading || (!user && !pathname.includes('/login'))) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <div>Memuat...</div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
    return WithAuthComponent;
}
