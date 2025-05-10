import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-_ZHD6Q3MMt-AhD5x3VS1iCGuT_PegOc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sgestaoretifica.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sgestaoretifica",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sgestaoretifica.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1044361584868",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1044361584868:web:3a40fdca12a0b5142a8cf1"
};

// Validate Firebase configuration
const validateConfig = (config: typeof firebaseConfig) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    console.error('Missing required Firebase configuration fields:', missingFields);
    return false;
  }
  
  return true;
};

// Initialize Firebase only if configuration is valid
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

if (validateConfig(firebaseConfig)) {
  // Initialize Firebase only if it hasn't been initialized yet
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      storage = getStorage(app);
      auth = getAuth(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  }
} else {
  throw new Error('Invalid Firebase configuration');
}

// Export initialized services
export { app, db, storage, auth };

// Helper function to get authenticated storage instance
export const getStorageWithAuth = () => {
  if (!auth.currentUser) {
    console.warn("User not authenticated for Storage access. Using default configuration.");
  }
  return storage;
};

// Export types for better type safety
export type FirebaseServices = {
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
  auth: Auth;
};

// Export a function to get all Firebase services
export const getFirebaseServices = (): FirebaseServices => ({
  app,
  db,
  storage,
  auth
});
