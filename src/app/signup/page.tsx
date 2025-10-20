import Link from 'next/link';
import { AuthForm } from '@/components/auth-forms';
import AppLogo from '@/components/app-logo';

export default function SignupPage() {
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
