'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, query, where, getDocs, collection, updateDoc, writeBatch } from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // This can happen if the user is in Auth but not in Firestore.
          // For this app, we'll treat them as logged out.
          setUser(null);
          await signOut(auth); // Sign them out of Auth as well
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userDoc.data().name}!`,
        });
        router.push('/dashboard');
      }
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
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (auth.currentUser && auth.currentUser.email === email) {
         throw new Error("This user is already signed up and logged in.");
      }

      // If a user record, created by an admin, already exists
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        if (userDoc.data().id) {
           toast({
              variant: 'destructive',
              title: 'Account Already Active',
              description: 'This email is already associated with an active account. Please log in.',
            });
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user: firebaseUser } = userCredential;

        // The user document in firestore was created without an ID that matches the auth user.
        // We now update the existing document with the correct ID.
        await updateDoc(doc(db, 'users', userDoc.id), {
          id: firebaseUser.uid,
          name, // Allow user to set their name on signup
        });

        toast({
          title: 'Account Activated',
          description: `Welcome, ${name}! Your account is now active.`,
        });
        router.push('/dashboard');
        return;
      }

      // Standard signup for a brand new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      const role = 'Support'; // Default role for new signups

      const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
        role,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      toast({
        title: 'Signup Successful',
        description: `Welcome, ${name}! Redirecting to your dashboard.`,
      });
      router.push('/dashboard');

    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred during signup.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by an active account. Please log in.';
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
    setUser(null);
    router.push('/');
  };

  // If loading, and on a protected route, show a loader.
  if (loading && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading, and on a protected route without a user,
  // the useEffect above will handle the redirect. Render null to avoid flicker.
  if (!loading && !user && !publicRoutes.includes(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, login, signup }}>
      {children}
    </AuthContext.Provider>
  );
}
