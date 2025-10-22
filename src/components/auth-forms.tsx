'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth, useFirestore } from '@/firebase';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

type AuthFormProps = {
  mode: 'login' | 'signup';
};

export function AuthForm({ mode }: AuthFormProps) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = mode === 'login' ? loginSchema : signupSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === 'login'
        ? { email: '', password: '' }
        : { name: '', email: '', password: '' },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    if (!auth || !db) return;
    setIsLoading(true);
    
    const { name, email, password } = values;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Now that the user is created, try to write to Firestore.
      // This is where the permission error is likely happening.
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      let existingUserDocId: string | null = null;
      querySnapshot.forEach((doc) => {
        if (!doc.data().id || doc.data().id === '') {
          existingUserDocId = doc.id;
        }
      });

      if (existingUserDocId) {
        const userDocRef = doc(db, 'users', existingUserDocId);
        const userDataToUpdate = {
          id: firebaseUser.uid,
          name: name,
          avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
        };
        
        updateDoc(userDocRef, userDataToUpdate)
          .then(() => {
            toast({
              title: 'Account Activated',
              description: `Welcome, ${name}! Your account is now active.`,
            });
            setIsLoading(false);
          })
          .catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'update',
              requestResourceData: userDataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
          });
      } else {
        const newUser: User = {
          id: firebaseUser.uid,
          name,
          email,
          avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
          role: 'Support',
        };
        const newUserDocRef = doc(db, 'users', firebaseUser.uid);
        
        setDoc(newUserDocRef, newUser)
          .then(() => {
            toast({
              title: 'Signup Successful',
              description: `Welcome, ${name}!`,
            });
            setIsLoading(false);
          })
          .catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: newUserDocRef.path,
              operation: 'create',
              requestResourceData: newUser,
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
          });
      }
    } catch (error: any) {
      // This catch block is now only for authentication errors.
      let errorMessage = 'An unexpected error occurred during signup.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
      setIsLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (mode === 'login') {
      await handleLogin(values as z.infer<typeof loginSchema>);
    } else {
      await handleSignup(values as z.infer<typeof signupSchema>);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <Link
            href={mode === 'login' ? '/signup' : '/'}
            className="font-semibold text-primary hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
