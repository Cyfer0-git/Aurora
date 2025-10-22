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

  // The loading state now correctly waits for both authentication and user data fetching.
  // If we are loading, or if loading is done and there is still no user,
  // we show the loader. The AuthProvider is responsible for the redirect logic
  // if the user is truly not authenticated.
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only if loading is complete AND we have a user object (with the role),
  // do we render the main dashboard layout.
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
