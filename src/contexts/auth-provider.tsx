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
import { doc, setDoc, getDoc, query, where, getDocs, updateDoc, collection } from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  resolving: boolean;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setResolving(true);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
          setUser(userData);
        } else {
          // This case can happen if the user doc creation fails after signup.
          // Or if an admin deleted the user from Firestore but not from Auth.
          setUser(null);
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setResolving(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
          title: 'Login Successful',
          description: `Welcome back!`,
      });
      router.push('/dashboard');
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
      // First, create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Now, create the user document in Firestore with the UID from authentication
      const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
        role: 'Support', // Default role for all new signups
      };

      // Use the user's UID as the document ID
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      toast({
        title: 'Signup Successful',
        description: `Welcome, ${name}! Redirecting to your dashboard.`,
      });
      // The onAuthStateChanged listener will handle setting user state and redirection
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred during signup.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in.';
      } else if (error.code === 'auth/api-key-not-valid') {
         errorMessage = 'The API key is invalid. Please check your Firebase configuration.'
      } else if (error.message){
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
      console.error("Signup error:", error);
    }
  };
  
  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const value = { user, loading, resolving, logout, login, signup };

  return (
    <AuthContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </AuthContext.Provider>
  );
}
