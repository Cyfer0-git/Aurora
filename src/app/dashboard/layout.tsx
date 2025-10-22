'use client';

import { useAuth } from '@/hooks/use-auth';
import { MainSidebar } from '@/components/main-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  // The AuthProvider now handles all loading states and redirects.
  // We just need to check if the user object is available to render the layout.
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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