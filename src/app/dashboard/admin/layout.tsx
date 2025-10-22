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
  
  // The parent DashboardLayout handles the case where the user is not logged in at all.
  // This layout's job is to verify permissions *after* we know who the user is.

  if (isLoading) {
    // While the useUser hook is trying to fetch the user and their Firestore document,
    // we must show a loading state. Rendering children prematurely would cause
    // data-fetching components to run with an unauthenticated user, leading to permission errors.
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying permissions...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    // Once loading is complete, if there's no user object or the user is not an admin,
    // we show an access denied message. We don't need to redirect here as the content
    // is already blocked, which is more secure.
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // If loading is complete and the user is a confirmed admin, render the admin pages.
  return <>{children}</>;
}
