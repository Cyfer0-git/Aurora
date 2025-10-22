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
      setIsLoading(true);
      return;
    }
    
    const unsubscribeFromAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userDocRef = doc(firestore, `users/${authUser.uid}`);
        
        const unsubscribeFromUserDoc = onSnapshot(userDocRef, (userDoc) => {
          setIsLoading(true); // Start loading when we get a new snapshot
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({
              ...userData,
              uid: authUser.uid,
              id: userDoc.id,
              email: authUser.email || userData.email, 
            });
          } else {
            // This can happen on first signup before the doc is created, or if the doc is deleted.
            setUser(null);
          }
          setIsLoading(false); // Stop loading once we have a definitive answer.
        }, (err) => {
            console.error("Error fetching user document:", err);
            setError(err);
            setUser(null);
            setIsLoading(false);
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return () => unsubscribeFromUserDoc();

      } else {
        setUser(null);
        setIsLoading(false);
      }
    }, (err) => {
        console.error("Error in onAuthStateChanged:", err);
        setError(err);
        setUser(null);
        setIsLoading(false);
    });

    return () => unsubscribeFromAuth();
  }, [auth, firestore]);

  return { user, isLoading, error };
}
