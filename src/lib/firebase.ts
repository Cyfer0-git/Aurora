// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2qjA7a4XmO_p5x_ngg9aE_u9R6ayokkk",
  authDomain: "aurora-42145.firebaseapp.com",
  projectId: "aurora-42145",
  storageBucket: "aurora-42145.appspot.com",
  messagingSenderId: "518332560249",
  appId: "1:518332560249:web:9e3b2e5a703a5578338f03",
  measurementId: "G-D1T4X7S98G"
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
