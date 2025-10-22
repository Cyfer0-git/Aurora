'use client';

import { AuthForm } from '@/components/auth-forms';
import AppLogo from '@/components/app-logo';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <AppLogo />
          <h1 className="text-3xl font-bold text-center">Aurora Teams</h1>
          <p className="text-muted-foreground text-center">
            Sign in to access your team dashboard.
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
