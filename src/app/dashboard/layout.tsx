'use client';

import { useUser } from '@/firebase';
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
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // While loading, show a full-screen spinner. This is the crucial part.
  // The rest of the app will not render until isLoading is false.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done and there's still no user, the useEffect will handle the redirect.
  // We can return null or a loader here as well to prevent a brief flash of content.
  if (!user) {
     return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only if loading is complete and a user exists, render the dashboard.
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
