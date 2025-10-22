'use client';
import { initializeFirebase, FirebaseProvider } from '.';
import * as React from 'react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [value] = React.useState(initializeFirebase);
  return <FirebaseProvider value={value}>{children}</FirebaseProvider>;
}
