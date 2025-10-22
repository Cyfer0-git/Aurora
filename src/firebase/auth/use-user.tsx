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
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // THIS IS THE CRITICAL CHANGE: Force a refresh of the ID token.
        // This ensures that any custom claims (like `admin: true`) are included
        // in the token that Firestore Security Rules will evaluate.
        authUser.getIdToken(true);

        const userDocRef = doc(firestore, `users/${authUser.uid}`);
        
        const unsubFromUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;

            if (userData.id !== authUser.uid) {
               setDoc(userDocRef, { id: authUser.uid }, { merge: true });
            }

            if (authUser.email === ADMIN_EMAIL && userData.role !== 'admin') {
              const updatedAdminData = { ...userData, role: 'admin' as const, id: authUser.uid };
              setDoc(userDocRef, updatedAdminData, { merge: true })
                .then(() => {
                   setUser({
                      ...updatedAdminData,
                      uid: authUser.uid,
                      email: authUser.email || updatedAdminData.email,
                    });
                })
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'update',
                        requestResourceData: { role: 'admin' },
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }).finally(() => {
                    setIsLoading(false);
                });

            } else {
              setUser({
                ...userData,
                uid: authUser.uid,
                id: authUser.uid,
                email: authUser.email || userData.email, 
              });
              setIsLoading(false);
            }
          } else {
             const newUserRole = authUser.email === ADMIN_EMAIL ? 'admin' : 'Support';
             const newUser: User = {
                uid: authUser.uid,
                email: authUser.email!,
                name: authUser.displayName || "New User",
                role: newUserRole,
                id: authUser.uid,
                avatarUrl: `https://picsum.photos/seed/${authUser.uid}/40/40`,
             };
             setDoc(userDocRef, newUser).then(() => {
                setUser(newUser);
             }).catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'create',
                    requestResourceData: newUser,
                });
                errorEmitter.emit('permission-error', permissionError);
             }).finally(() => {
                setIsLoading(false);
             })
          }
        }, (err) => {
            console.error("Error fetching user document:", err);
            setError(err);
            setIsLoading(false);
        });

        return unsubFromUser;

      } else {
        setUser(null);
        setIsLoading(false);
      }
    }, (err) => {
        console.error("Error in onAuthStateChanged:", err);
        setError(err);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, isLoading, error };
}
