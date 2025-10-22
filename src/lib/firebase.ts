// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-gN_ucwTz_3_u0i4I1TjT1b-v7bJvM-s",
  authDomain: "aurora-426814.firebaseapp.com",
  projectId: "aurora-426814",
  storageBucket: "aurora-426814.appspot.com",
  messagingSenderId: "1083442122687",
  appId: "1:1083442122687:web:86f6d61a35791c2b53c729",
  measurementId: "G-F385EH8J6H"
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
