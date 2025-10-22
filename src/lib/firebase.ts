
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB3mtDcW_HHBgM11lmiNfKrLDKWg_W0tVo",
  authDomain: "gen-lang-client-0115875430.firebaseapp.com",
  projectId: "gen-lang-client-0115875430",
  storageBucket: "gen-lang-client-0115875430.appspot.com",
  messagingSenderId: "60111589935",
  appId: "1:60111589935:web:77f0d28417958199ffecda",
  measurementId: "G-K8ZSD5L2XB"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
