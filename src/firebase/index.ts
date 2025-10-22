'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';


const firebaseConfig = {
  apiKey: "AIzaSyB3mtDcW_HHBgM11lmiNfKrLDKWg_W0tVo",
  authDomain: "gen-lang-client-0115875430.firebaseapp.com",
  projectId: "gen-lang-client-0115875430",
  storageBucket: "gen-lang-client-0115875430.appspot.com",
  messagingSenderId: "60111589935",
  appId: "1:60111589935:web:77f0d28417958199ffecda"
};

function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  const firebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  return { firebaseApp, auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
};
