import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, serverTimestamp } from 'firebase/firestore';

// Default Firebase configuration for SIH Multi-Phone Demo.
// Env variables override if set in .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA_SIH2026_DemoConfigKey_NERLogiSense',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ner-logisense.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ner-logisense',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ner-logisense.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '987654321012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:987654321012:web:a1b2c3d4e5f6g7h8i9j0',
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  signInAnonymously,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  updateDoc,
  serverTimestamp,
  FirebaseUser,
};
