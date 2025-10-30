// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWOsyYFyTaa7iFeIz31aK65023sLX5ZYg",
  authDomain: "aiop-gocg.firebaseapp.com",
  databaseURL: "https://aiop-gocg-default-rtdb.firebaseio.com",
  projectId: "aiop-gocg",
  storageBucket: "aiop-gocg.firebasestorage.app",
  messagingSenderId: "134306669895",
  appId: "1:134306669895:web:87384be1a87f43159b9862",
  measurementId: "G-LVKMFEX10B"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = firestore; // Alias para compatibilidade
export const realtimeDB = getDatabase(app);
export const storage = getStorage(app);

// Initialize Analytics (client-side only)
export const initializeAnalytics = async () => {
  if (typeof window !== "undefined") {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      return getAnalytics(app);
    }
  }
  return null;
};

export default app;