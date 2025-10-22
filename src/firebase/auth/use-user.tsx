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
      // Keep loading if Firebase services are not available yet.
      setIsLoading(true);
      return;
    }
    
    // Subscribe to Firebase auth state changes
    const unsubscribeFromAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // If a user is authenticated, listen for changes to their document in Firestore.
        const userDocRef = doc(firestore, `users/${authUser.uid}`);
        
        const unsubscribeFromUserDoc = onSnapshot(userDocRef, (userDoc) => {
          setIsLoading(true); // Start loading when we get a new snapshot
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Combine auth data and Firestore data into a single user object.
            setUser({
              ...userData,
              uid: authUser.uid,
              id: userDoc.id,
              email: authUser.email || userData.email, 
            });
          } else {
            // This can happen on first signup before the doc is created, or if the doc is deleted.
            // A user without a user document is not considered fully logged in.
            setUser(null);
          }
          setIsLoading(false); // Stop loading once we have the user data or know it doesn't exist.
        }, (err) => {
            console.error("Error fetching user document:", err);
            // This is likely a permission error.
            setError(err);
            setUser(null);
            setIsLoading(false);
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        // Cleanup the Firestore subscription when the auth state changes.
        return () => unsubscribeFromUserDoc();

      } else {
        // If there is no authenticated user, set user to null and stop loading.
        setUser(null);
        setIsLoading(false);
      }
    }, (err) => {
        // Handle errors with the auth subscription itself.
        console.error("Error in onAuthStateChanged:", err);
        setError(err);
        setUser(null);
        setIsLoading(false);
    });

    // Cleanup the auth subscription when the component unmounts.
    return () => unsubscribeFromAuth();
  }, [auth, firestore]);

  return { user, isLoading, error };
}
