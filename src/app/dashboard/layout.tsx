'use client';

import { useAuth } from '@/hooks/use-auth';
import { MainSidebar } from '@/components/main-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);


  // While loading, or if there's no user yet, show a loader.
  // This prevents a flash of the dashboard content before the redirect happens.
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, render the main dashboard layout.
  return (
    <SidebarProvider>
      <div className="flex">
        <MainSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
