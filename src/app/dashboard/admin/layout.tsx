'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // The parent DashboardLayout handles the main loading state for auth.
  // This component's only job is to protect the admin routes *after* the user object is fully loaded.
  
  useEffect(() => {
    // We wait for the useUser hook to finish loading the user's Firestore data.
    if (!isLoading && user?.role !== 'admin') {
      // If loading is done and user is NOT an admin, redirect them away.
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying permissions...</p>
      </div>
    );
  }

  // If loading is done, but the user is not an admin (or not logged in at all).
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page. Redirecting...
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // If loading is done and the user is an admin, show the content.
  return <>{children}</>;
}
