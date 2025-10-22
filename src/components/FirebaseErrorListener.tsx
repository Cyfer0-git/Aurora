'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client component that listens for Firestore permission errors and displays
 * them as a toast notification. This provides immediate, detailed feedback
 * to the developer during development.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('Contextual Firestore Error:', error.message, error.context);

      // We throw the error here so that the Next.js development overlay can
      // pick it up and display it. This is the most effective way to show
      // the detailed error to the developer.
      if (process.env.NODE_ENV === 'development') {
         throw error;
      } else {
        // In production, we might log this to a service or show a generic toast.
         toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You do not have permission to perform this action.',
         });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component does not render anything itself.
  return null;
}
