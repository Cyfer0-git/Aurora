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

  // This is the gatekeeper for the entire dashboard.
  // It waits until the auth state is fully resolved (loading is false).
  // If loading is finished and there's still no user, the AuthProvider's
  // own useEffect will handle the redirect to the login page.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and there is no user, it means the redirect
  // from AuthProvider is about to happen. We can show a loader to avoid
  // a flash of an empty screen.
  if (!user) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only if loading is complete AND we have a user object, do we render
  // the main dashboard layout. By this point, the user object is guaranteed
  // to be complete, including the 'role' property.
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
