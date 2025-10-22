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

  // While the useUser hook is checking for authentication and fetching the user's role,
  // display a loading indicator. This is crucial to prevent rendering content prematurely.
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying permissions...</p>
      </div>
    );
  }

  // After loading is complete, if there is no user or the user's role is not 'admin',
  // deny access to the admin section.
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have the required 'admin' role to view this page. Your current role is '{user?.role || 'guest'}'.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // If loading is complete and the user is an admin, render the children components.
  return <>{children}</>;
}
