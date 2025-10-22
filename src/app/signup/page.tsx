'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/auth-forms';
import AppLogo from '@/components/app-logo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
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
          <h1 className="text-3xl font-bold text-center">Create an Account</h1>
          <p className="text-muted-foreground text-center">
            Join Aurora Teams and boost your productivity.
          </p>
        </div>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
