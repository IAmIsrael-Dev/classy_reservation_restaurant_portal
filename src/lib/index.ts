/**
 * Main export file for Firebase library
 * Provides clean imports throughout the application
 */

// Firebase Core
export { auth, db, isFirebaseInitialized, getFirebaseConfig } from './firebase';

// Authentication Service
export {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logout,
  getRestaurantProfile,
  createRestaurantProfile,
  updateRestaurantProfile,
  initializeUserProfile,
  isValidEmail,
  validatePassword,
  handleFirestoreError,
  authService,
} from './firebase-auth';

// Types
export type {
  AuthContextType,
  RestaurantProfile,
  RestaurantProfileInput,
  RestaurantHours,
  DayHours,
  Reservation,
  ReservationStatus,
  Table,
  TableStatus,
  TablePosition,
  StaffMember,
  StaffRole,
  FirebaseError,
  ApiResponse,
} from './types';

export { COLLECTIONS } from './types';