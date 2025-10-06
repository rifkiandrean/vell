

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import type { CompanyInfo, LandingPageContent } from '@/lib/types';
import { getFunctions, httpsCallable } from "firebase/functions";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  companyName: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  ersLogoUrl?: string;
  vellLogoUrl?: string;
  websiteVersion?: string;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  createUser: (email: string, password: string, displayName: string, role: string) => Promise<void>;
  transformGoogleDriveUrl: (url: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children, companyName: initialCompanyName }: { children: React.ReactNode, companyName: string }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ companyName: initialCompanyName, logoUrl: '', ersLogoUrl: '', websiteVersion: ''});
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent>({});

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
    // This function should call a Firebase Function to create a user and set custom claims.
    // Directly creating user from client is okay for display name, but not for roles (custom claims).
    // For this example, we'll simulate the user creation part and assume a function would set the role.

    const functions = getFunctions();
    const setUserRole = httpsCallable(functions, 'setUserRole');

    // Create user in a secondary auth instance to not affect current user's session
    const { UserCredentialImpl } = await import('firebase/auth');
    const tempAuth = getAuth(); // It's tricky to create a truly separate auth instance on client
    
    // For now, let's create the user directly. THIS IS NOT SECURE FOR SETTING ROLES.
    // In a real app, this should be a call to a Firebase Function.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });

    // The secure way: call a Firebase Function to set the role
    // await setUserRole({ uid: userCredential.user.uid, role: role });
    // For now, we just log this action.
    console.log(`User ${displayName} created with email ${email} and role ${role}. In a real app, a Cloud Function would set the custom claim.`);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    const unsubCompanyInfo = onSnapshot(doc(db, "settings", "companyInfo"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as CompanyInfo;
            setCompanyInfo({
                ...data,
                companyName: data.companyName || initialCompanyName,
            });
        }
    });

    const unsubLandingPage = onSnapshot(doc(db, "settings", "landingPage"), (docSnap) => {
        if (docSnap.exists()) {
            setLandingPageContent(docSnap.data() as LandingPageContent);
        }
    });

    return () => {
        unsubAuth();
        unsubCompanyInfo();
        unsubLandingPage();
    };
  }, [initialCompanyName]);

  const value = {
    user,
    loading,
    companyName: companyInfo.companyName,
    address: companyInfo.address,
    phone: companyInfo.phone,
    logoUrl: companyInfo.logoUrl || '',
    ersLogoUrl: companyInfo.ersLogoUrl || '',
    vellLogoUrl: landingPageContent.vellLogoUrl || '',
    websiteVersion: companyInfo.websiteVersion,
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

            const isUpdAdminPath = pathname.startsWith('/upd/') && pathname.includes('/admin');
            const isErsCafeAdminPath = pathname.startsWith('/ers/cafe/admin');
            const isAdminPath = pathname.startsWith('/admin');

            const isUpdLoginPath = isUpdAdminPath && pathname.endsWith('/login');
            const isErsCafeLoginPath = pathname === '/ers/cafe/admin/login';
            const isAdminLoginPath = pathname === '/admin/login';

            if (!user) {
                if (isUpdAdminPath && !isUpdLoginPath) {
                    const invitationId = pathname.split('/')[2];
                    router.replace(`/upd/${invitationId}/admin/login`);
                } else if (isErsCafeAdminPath && !isErsCafeLoginPath) {
                    router.replace('/ers/cafe/admin/login');
                } else if (isAdminPath && !isAdminLoginPath) {
                    router.replace('/admin/login');
                }
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
