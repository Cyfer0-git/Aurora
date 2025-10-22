'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and the user is NOT an admin, redirect them.
    if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // While loading, show a spinner to prevent any premature rendering or checks.
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if the user is still not an admin (or not logged in), show access denied.
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page. This could be a temporary issue if you have just logged in. Please wait a moment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If the user is an admin, render the admin content.
  return <>{children}</>;
}
