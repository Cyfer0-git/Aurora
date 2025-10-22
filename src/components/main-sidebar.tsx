'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  FileText,
  Shield,
  Users,
  Settings,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import AppLogo from './app-logo';
import { useUser, useAuth } from '@/firebase';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { signOut } from 'firebase/auth';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'My Tasks', icon: ClipboardList },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/reports', label: 'Daily Reports', icon: FileText },
];

const adminMenuItems = [
  { href: '/dashboard/admin/users', label: 'Manage Users', icon: Users },
  {
    href: '/dashboard/admin/tasks',
    label: 'Manage Tasks',
    icon: ClipboardList,
  },
  {
    href: '/dashboard/admin/announcements',
    label: 'Post Announcement',
    icon: Megaphone,
  },
  {
    href: '/dashboard/admin/reports',
    label: 'View Reports',
    icon: FileText,
  },
];

export function MainSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        router.push('/');
    }
  }


  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  };
  
  if (!user) {
    return null; // Don't render sidebar if user is not loaded
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <AppLogo className="w-8 h-8" />
          <h2 className="text-xl font-semibold tracking-tight">Aurora Teams</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={
                    item.href === '/dashboard'
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                  }
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        {user?.role === 'admin' && (
          <>
            <div className="my-4">
              <p className="px-4 text-sm font-semibold text-muted-foreground">
                Admin Panel
              </p>
            </div>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={
                        item.href === '/dashboard/admin'
                          ? pathname === item.href || pathname.startsWith('/dashboard/admin/')
                          : pathname.startsWith(item.href)
                      }
                      className="justify-start"
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2 border-t">
          {user && (
            <>
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <div className="ml-auto">
                <UserNav onLogout={handleLogout} />
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
