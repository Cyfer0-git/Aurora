'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseAuthUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const publicRoutes = ['/', '/signup'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
          setUser(userData);
          // If user is on a public page, redirect to dashboard
          if(publicRoutes.includes(pathname)) {
            router.push('/dashboard');
          }
        } else {
          // User exists in auth, but not firestore. Log them out to be safe.
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
        // If user is on a protected page, redirect to login
        if(!publicRoutes.includes(pathname)) {
            router.push('/');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
          title: 'Login Successful',
          description: `Welcome back!`,
      });
      // The onAuthStateChanged listener will handle the redirect.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      });
      console.error("Login error:", error);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const newUser: Omit<User, 'id'> = {
        name,
        email,
        avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
        role: 'Support', // Default role
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      toast({
        title: 'Signup Successful',
        description: `Welcome, ${name}! Redirecting to your dashboard.`,
      });
      // The onAuthStateChanged listener will handle the redirect.
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred during signup.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in.';
      } else if (error.code === 'auth/api-key-not-valid'){
         errorMessage = 'The API key is invalid. Please contact support.'
      }
      else if (error.message){
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
      console.error("Authentication or Firestore error:", error);
    }
  };
  
  const logout = async () => {
    await signOut(auth);
    // The onAuthStateChanged listener will handle the redirect.
  };

  // While loading, or if unauthenticated on a protected route, show a loader.
  if (loading || (!user && !publicRoutes.includes(pathname))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If authenticated on a public route, show a loader while redirecting.
  if (user && publicRoutes.includes(pathname)) {
      return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, logout, login, signup }}>
      <FirebaseErrorListener />
      {children}
    </AuthContext.Provider>
  );
}