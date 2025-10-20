'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { users } from '@/lib/data';
import type { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Mock session check
    try {
      const storedUser = sessionStorage.getItem('aurora-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse user from session storage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string) => {
    const foundUser = users.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      sessionStorage.setItem('aurora-user', JSON.stringify(foundUser));
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${foundUser.name}!`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'No user found with that email.',
      });
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('aurora-user');
    router.push('/');
  };

  const signup = async (name: string, email: string) => {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'A user with this email already exists.',
      });
      return;
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatarUrl: `https://picsum.photos/seed/user${users.length + 1}/40/40`,
      role: 'member',
    };
    // Add the new user to our mock database
    users.push(newUser);
    
    // Log the user in directly after signup
    setUser(newUser);
    sessionStorage.setItem('aurora-user', JSON.stringify(newUser));
    toast({
      title: 'Signup Successful',
      description: `Welcome, ${newUser.name}!`,
    });
    router.push('/dashboard');
  };

  if (loading) {
    return (
       <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
             </div>
          </div>
       </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
