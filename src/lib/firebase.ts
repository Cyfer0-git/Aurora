// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCV_iL3fTew4Y-o_V3UO3b_J-i9kL_xL4w",
  authDomain: "gen-lang-client-0115875430.firebaseapp.com",
  projectId: "gen-lang-client-0115875430",
  storageBucket: "gen-lang-client-0115875430.appspot.com",
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
