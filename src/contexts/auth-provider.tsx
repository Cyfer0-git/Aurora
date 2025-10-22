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
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  resolving: boolean; // Keep this for role-specific checks if needed elsewhere
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
  const pathname = usePathname();
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
          // This case should not happen for an existing user
          setUser(null); 
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setResolving(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname === '/' || pathname === '/signup';

    if (!user && !isAuthPage) {
      router.push('/');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
          title: 'Login Successful',
          description: `Welcome back!`,
      });
      // The onAuthStateChanged listener and useEffect will handle redirection.
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
      // Check if a user document with this email already exists but has no ID
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      let existingUserDoc: any = null;
      querySnapshot.forEach((doc) => {
        if (!doc.data().id) {
          existingUserDoc = doc;
        }
      });

      if (existingUserDoc) {
        // This is an invited user completing their signup.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Update the existing document with the new UID
        const userDocRef = doc(db, 'users', existingUserDoc.id);
        await updateDoc(userDocRef, { 
          id: firebaseUser.uid, 
          name: name, // Allow them to set their name
          avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
        });

        // Now, we need to delete the old placeholder document if it has a different ID,
        // and create a new one. A simpler approach is to create a new doc with the UID
        // and update it with existing data, then delete the old one if it's different.
        // For simplicity here, we'll assume the invited user record can be updated.
        // A more robust solution might involve a cloud function.
        // The simplest path for now: let's re-write the doc with the new UID as the ID.
        
        const userData = {
            ...existingUserDoc.data(),
            id: firebaseUser.uid,
            name: name,
            email: email,
            avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        if(existingUserDoc.id !== firebaseUser.uid){
           await deleteDoc(doc(db, 'users', existingUserDoc.id));
        }

        toast({
          title: 'Account Activated',
          description: `Welcome, ${name}! Your account is now active.`,
        });

      } else {
        // This is a brand new user, not an invited one.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newUser: User = {
          id: firebaseUser.uid,
          name,
          email,
          avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
          role: 'Support', // Default role for all new signups
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        toast({
          title: 'Signup Successful',
          description: `Welcome, ${name}!`,
        });
      }
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
    setUser(null);
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
