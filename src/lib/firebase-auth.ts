/**
 * Firebase Authentication Service
 * 
 * Handles all authentication-related operations including:
 * - Google Sign-In
 * - Email/Password Authentication
 * - User Profile Management
 * - Firestore Integration
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { RestaurantProfile, RestaurantProfileInput, FirebaseError } from './types';
import { COLLECTIONS } from './types';

// ============================================================================
// Google Authentication Provider Setup
// ============================================================================

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Sign in with Google
 * @returns Promise<User>
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw handleAuthError(error as AuthError);
  }
};

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 * @returns Promise<User>
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw handleAuthError(error as AuthError);
  }
};

/**
 * Create new user with email and password
 * @param email - User email
 * @param password - User password
 * @param displayName - User display name
 * @returns Promise<User>
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // Create user account
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Update user profile with display name
    await updateProfile(user, { displayName });
    
    return user;
  } catch (error) {
    console.error('Email sign-up error:', error);
    throw handleAuthError(error as AuthError);
  }
};

/**
 * Sign out current user
 * @returns Promise<void>
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw handleAuthError(error as AuthError);
  }
};

// ============================================================================
// Firestore Profile Management
// ============================================================================

/**
 * Get restaurant profile document reference
 * @param userId - User ID
 * @returns DocumentReference
 */
const getProfileRef = (userId: string): DocumentReference => {
  return doc(db, COLLECTIONS.RESTAURANT_OWNERS, userId);
};

/**
 * Get restaurant profile from Firestore
 * @param userId - User ID
 * @returns Promise<RestaurantProfile | null>
 */
export const getRestaurantProfile = async (
  userId: string
): Promise<RestaurantProfile | null> => {
  try {
    const profileRef = getProfileRef(userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data() as RestaurantProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching restaurant profile:', error);
    throw error;
  }
};

/**
 * Create restaurant profile in Firestore
 * @param userId - User ID
 * @param profileData - Partial restaurant profile data
 * @returns Promise<void>
 */
export const createRestaurantProfile = async (
  userId: string,
  profileData: Partial<RestaurantProfileInput>
): Promise<void> => {
  try {
    const profileRef = getProfileRef(userId);
    
    const newProfile: RestaurantProfileInput = {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(profileRef, newProfile);
  } catch (error) {
    console.error('Error creating restaurant profile:', error);
    throw error;
  }
};

/**
 * Update restaurant profile in Firestore
 * @param userId - User ID
 * @param profileData - Partial restaurant profile data to update
 * @returns Promise<void>
 */
export const updateRestaurantProfile = async (
  userId: string,
  profileData: Partial<RestaurantProfileInput>
): Promise<void> => {
  try {
    const profileRef = getProfileRef(userId);
    
    const updates = {
      ...profileData,
      updatedAt: serverTimestamp(),
    };
    
    // Cast to any to satisfy updateDoc's complex type requirements
    await updateDoc(profileRef, updates as Record<string, unknown>);
  } catch (error) {
    console.error('Error updating restaurant profile:', error);
    throw error;
  }
};

/**
 * Initialize or get restaurant profile for a user
 * Creates a basic profile if it doesn't exist
 * @param user - Firebase User object
 * @returns Promise<RestaurantProfile>
 */
export const initializeUserProfile = async (
  user: User
): Promise<RestaurantProfile> => {
  try {
    // Check if profile exists
    let profile = await getRestaurantProfile(user.uid);
    
    // Create basic profile if it doesn't exist
    if (!profile) {
      const basicProfile: Partial<RestaurantProfileInput> = {
        displayName: user.displayName || 'Restaurant Owner',
        email: user.email || '',
        restaurantName: '',
        cuisineType: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        hasCompletedOnboarding: false,
      };
      
      await createRestaurantProfile(user.uid, basicProfile);
      
      // Fetch the newly created profile
      profile = await getRestaurantProfile(user.uid);
    }
    
    return profile as RestaurantProfile;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
};

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Convert Firebase Auth errors to user-friendly messages
 * @param error - Firebase AuthError
 * @returns Error with friendly message
 */
const handleAuthError = (error: AuthError): Error => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please create an account first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again, or create a new account.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
  };
  
  const friendlyMessage = errorMessages[error.code] || error.message;
  
  return new Error(friendlyMessage);
};

/**
 * Handle Firestore errors
 * @param error - Error object
 * @returns FirebaseError
 */
export const handleFirestoreError = (error: unknown): FirebaseError => {
  const err = error as { code?: string; message?: string };
  return {
    code: err.code || 'unknown',
    message: err.message || 'An unknown error occurred',
  };
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate email format
 * @param email - Email to validate
 * @returns boolean
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  message: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long',
    };
  }
  
  return {
    isValid: true,
    message: 'Password is valid',
  };
};

// ============================================================================
// Export all auth functions
// ============================================================================

export const authService = {
  // Authentication
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logout,
  
  // Profile Management
  getRestaurantProfile,
  createRestaurantProfile,
  updateRestaurantProfile,
  initializeUserProfile,
  
  // Validation
  isValidEmail,
  validatePassword,
  
  // Error Handling
  handleFirestoreError,
};

export default authService;