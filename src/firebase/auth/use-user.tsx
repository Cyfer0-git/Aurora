'use client';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import * as React from 'react';
import { useAuth, useFirestore } from '..';
import type { User } from '@/lib/definitions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Combine Firebase Auth user with Firestore user data
type UserData = User & { uid: string };

const ADMIN_EMAIL = 'avay.gupta@auroramy.com';

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!auth || !firestore) {
      // Firebase is not initialized yet.
      return;
    }
    
    // Listen for changes in authentication state (login/logout).
    const unsubscribeFromAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // If a user is logged in, listen for changes to their document in Firestore.
        const userDocRef = doc(firestore, `users/${authUser.uid}`);
        
        const unsubscribeFromUserDoc = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            // If the user document exists, combine it with the auth data.
            const userData = userDoc.data() as User;
            setUser({
              ...userData,
              uid: authUser.uid,
              id: authUser.uid,
              email: authUser.email || userData.email, 
            });
          } else {
            // This case might happen briefly on first sign-up before the doc is created.
            // We set isLoading to false, but the user object might be incomplete.
            // The signup logic in auth-forms.tsx is responsible for creating the doc.
            setUser(null);
          }
          setIsLoading(false);
        }, (err) => {
            console.error("Error fetching user document:", err);
            setError(err);
            setIsLoading(false);
        });

        return unsubscribeFromUserDoc; // This will be called on cleanup.

      } else {
        // If no user is logged in, clear user data and stop loading.
        setUser(null);
        setIsLoading(false);
      }
    }, (err) => {
        // Handle any errors with the auth state listener itself.
        console.error("Error in onAuthStateChanged:", err);
        setError(err);
        setIsLoading(false);
    });

    // Cleanup function for the useEffect hook.
    return () => unsubscribeFromAuth();
  }, [auth, firestore]);

  return { user, isLoading, error };
}
