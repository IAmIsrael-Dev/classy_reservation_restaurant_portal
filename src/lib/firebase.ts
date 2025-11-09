/**
 * Firebase Core Configuration and Initialization
 * 
 * This file initializes Firebase services and exports them for use throughout the app.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// ============================================================================
// Firebase Configuration
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBgy6ulDXTfCKPDZPpodpJElOTXf2KF8-o",
  authDomain: "demoapp1-65f54.firebaseapp.com",
  databaseURL: "https://demoapp1-65f54-default-rtdb.firebaseio.com",
  projectId: "demoapp1-65f54",
  storageBucket: "demoapp1-65f54.firebasestorage.app",
  messagingSenderId: "945225510979",
  appId: "1:945225510979:web:f2e6d03ed559c6c6a1a4f6"
};

// ============================================================================
// Initialize Firebase
// ============================================================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Initialize Firebase App
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Services
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Enable emulators in development (optional)
  // Check if running in browser environment
  if (typeof window !== 'undefined') {
    const useEmulators = false; // Set to true to use local emulators
    
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔧 Firebase emulators connected');
    }
  }
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

// ============================================================================
// Export Firebase Services
// ============================================================================

export { app, auth, db };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if Firebase is properly initialized
 */
export const isFirebaseInitialized = (): boolean => {
  try {
    return !!(app && auth && db);
  } catch {
    return false;
  }
};

/**
 * Get Firebase project information
 */
export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});
