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

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!auth || !firestore) {
      // Firebase is not initialized yet, wait for it.
      // Setting isLoading to true ensures dependent components also wait.
      setIsLoading(true);
      return;
    }
    
    // Listen for changes in authentication state (login/logout).
    const unsubscribeFromAuth = onAuthStateChanged(auth, (authUser) => {
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
              id: userDoc.id, // Use the document id
              email: authUser.email || userData.email, 
            });
          } else {
            // This can happen on first signup before the doc is created.
            // The user is authenticated but doesn't have a profile yet.
            // Set user to null and let other parts of the app handle profile creation.
            setUser(null);
          }
          // We are done loading once we have a definitive answer about the user doc.
          setIsLoading(false);
        }, (err) => {
            console.error("Error fetching user document:", err);
            // This could be a permission error if rules are wrong.
            setError(err);
            setUser(null);
            setIsLoading(false);
        });

        return unsubscribeFromUserDoc;

      } else {
        // If no user is logged in, clear user data and stop loading.
        setUser(null);
        setIsLoading(false);
      }
    }, (err) => {
        // Handle any errors with the auth state listener itself.
        console.error("Error in onAuthStateChanged:", err);
        setError(err);
        setUser(null);
        setIsLoading(false);
    });

    // Cleanup function for the useEffect hook.
    return () => unsubscribeFromAuth();
  }, [auth, firestore]);

  return { user, isLoading, error };
}
