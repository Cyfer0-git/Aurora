'use client';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import * as React from 'react';
import { useAuth, useFirestore } from '..';
import type { User } from '@/lib/definitions';

// Combine Firebase Auth user with Firestore user data
type UserData = User & { uid: string };

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!auth || !firestore) {
      // Firebase services might not be available yet.
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is authenticated, now get their data from Firestore.
        const userDocRef = doc(firestore, `users/${authUser.uid}`);
        
        const unsubFromUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Combine auth and firestore data into a single user object.
            setUser({
              ...userData,
              uid: authUser.uid,
              // Ensure critical auth fields are present if needed elsewhere
              email: authUser.email || userData.email, 
            });
          } else {
            // User is authenticated but no record in Firestore.
            // This can happen during signup or if the record is deleted.
            // We consider this "loaded" but without extended user data.
             setUser({
                uid: authUser.uid,
                email: authUser.email!,
                name: authUser.displayName || "New User",
                role: 'Support', // A safe default
                id: authUser.uid,
                avatarUrl: '',
             });
          }
          setIsLoading(false);
        }, (err) => {
            // Handle Firestore read errors
            console.error("Error fetching user document:", err);
            setError(err);
            setIsLoading(false);
        });

        // This function will be called when the effect cleans up.
        // It's important for detaching the Firestore listener.
        return unsubFromUser;

      } else {
        // User is not authenticated.
        setUser(null);
        setIsLoading(false);
      }
    }, (err) => {
        // Handle Auth state change errors
        console.error("Error in onAuthStateChanged:", err);
        setError(err);
        setIsLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, isLoading, error };
}
