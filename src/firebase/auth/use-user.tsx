'use client';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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

            // Check if the current user is the designated admin but doesn't have the admin role yet.
            if (authUser.email === ADMIN_EMAIL && userData.role !== 'admin') {
              // This is the admin user, but their role is incorrect in Firestore.
              // We will update it for them.
              const updatedAdminData = { ...userData, role: 'admin' as const };
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
              // This is a regular user or an admin with the correct role.
              setUser({
                ...userData,
                uid: authUser.uid,
                email: authUser.email || userData.email, 
              });
              setIsLoading(false);
            }
          } else {
            // User is authenticated but no record in Firestore.
            // This can happen during signup or if the record is deleted.
             const newUserRole = authUser.email === ADMIN_EMAIL ? 'admin' : 'Support';
             const newUser: User = {
                uid: authUser.uid,
                email: authUser.email!,
                name: authUser.displayName || "New User",
                role: newUserRole,
                id: authUser.uid,
                avatarUrl: '',
             };
             // Create the document for the new user.
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
