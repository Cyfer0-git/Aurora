'use client';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import * as React from 'react';
import { useAuth, useFirestore } from '..';
import type { User } from '@/lib/definitions';

interface UserData extends FirebaseAuthUser, DocumentData {}

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const userDocRef = doc(firestore, `users/${authUser.uid}`);
        const unsubFromUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...authUser, ...userData });
          } else {
             // This case might happen if the user doc is not yet created
             // or was deleted. We set the auth user for now.
             setUser(authUser);
          }
          setIsLoading(false);
        });
        return unsubFromUser;
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [auth, firestore]);

  return { user, isLoading };
}
