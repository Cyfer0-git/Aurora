// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlcRuRTcd5q3GYIgsmndH4KhRMAxszN6Y",
  authDomain: "studio-7060837792-ccef8.firebaseapp.com",
  projectId: "studio-7060837792-ccef8",
  storageBucket: "studio-7060837792-ccef8.appspot.com",
  messagingSenderId: "947151122815",
  appId: "1:947151122815:web:10240b9607ee19f66f6a4a"
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
