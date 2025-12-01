/**
 * Firebase Core Configuration and Initialization
 * 
 * This file initializes Firebase services and exports them for use throughout the app.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

// ============================================================================
// Firebase Configuration
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDtpbLxOG487GanuXEJKbifebGoANNIuas",
  authDomain: "classyreserveai.firebaseapp.com",
  projectId: "classyreserveai",
  storageBucket: "classyreserveai.firebasestorage.app",
  messagingSenderId: "798527729998",
  appId: "1:798527729998:web:f7bc705c4000f9134c6e1f",
  measurementId: "G-QY70QN5G2W"
};

// ============================================================================
// Initialize Firebase
// ============================================================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Initialize Firebase App
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
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

export { app, auth, db, storage };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if Firebase is properly initialized
 */
export const isFirebaseInitialized = (): boolean => {
  try {
    return !!(app && auth && db && storage);
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