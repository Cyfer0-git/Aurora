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
  const { user, resolving } = useAuth(); // Use the new resolving state
  const router = useRouter();

  useEffect(() => {
    // If resolution is complete and the user is either not present or not an admin, redirect.
    if (!resolving && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, resolving, router]);

  // While resolving user data, show a spinner to prevent premature checks.
  if (resolving) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After resolving, if the user is still not an admin, they will be redirected.
  // This UI might flash briefly before the redirect, or show if something unexpected happens.
  if (!user || user.role !== 'admin') {
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

  // If resolution is complete and the user is an admin, render the content.
  return <>{children}</>;
}
