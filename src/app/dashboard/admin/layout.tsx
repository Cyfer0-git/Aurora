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

  // The parent DashboardLayout now handles the main loading state.
  // This component's only job is to protect the admin routes *after* loading is complete.
  
  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      // If loading is done and user is not an admin, redirect.
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // While the parent is loading, this component's isLoading will also be true.
  // The parent will show a spinner, so this component doesn't need to.
  // But if we get here and it's still loading for some reason, we can show a spinner.
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done and the user is not an admin (or not a user at all).
  if (user?.role !== 'admin') {
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
  
  // If loading is done and user is an admin, show the content.
  return <>{children}</>;
}
