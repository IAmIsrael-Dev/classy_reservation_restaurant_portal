/**
 * TypeScript type definitions for Firebase data structures
 */

import type { User } from 'firebase/auth';
import type { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthContextType {
  user: User | null;
  restaurantProfile: RestaurantProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRestaurantProfile: (profile: Partial<RestaurantProfile>) => Promise<void>;
}

// ============================================================================
// Restaurant Profile Types
// ============================================================================

export interface RestaurantProfile {
  // User Information
  displayName: string;
  email: string;
  
  // Restaurant Information
  restaurantName: string;
  cuisineType: string;
  
  // Contact Information
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Onboarding Status
  hasCompletedOnboarding: boolean;
  
  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  
  // Optional fields for future expansion
  description?: string;
  website?: string;
  capacity?: number;
  openingHours?: RestaurantHours;
  photos?: string[];
}

// Type for creating/updating profiles (allows FieldValue for timestamps)
export interface RestaurantProfileInput {
  // User Information
  displayName?: string;
  email?: string;
  
  // Restaurant Information
  restaurantName?: string;
  cuisineType?: string;
  
  // Contact Information
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Onboarding Status
  hasCompletedOnboarding?: boolean;
  
  // Timestamps (allows FieldValue for serverTimestamp)
  createdAt?: Timestamp | Date | FieldValue;
  updatedAt?: Timestamp | Date | FieldValue;
  
  // Optional fields for future expansion
  description?: string;
  website?: string;
  capacity?: number;
  openingHours?: RestaurantHours;
  photos?: string[];
}

export interface RestaurantHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

// ============================================================================
// Reservation Types (Future Use)
// ============================================================================

export interface Reservation {
  id: string;
  restaurantId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  date: Timestamp | Date;
  time: string;
  status: ReservationStatus;
  tableNumber?: string;
  specialRequests?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'seated' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show';

// ============================================================================
// Table Types (Future Use)
// ============================================================================

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  section: string;
  status: TableStatus;
  position?: TablePosition;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface TablePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Staff Types (Future Use)
// ============================================================================

export interface StaffMember {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: StaffRole;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type StaffRole = 'host' | 'manager' | 'server' | 'admin';

// ============================================================================
// Firestore Collection Names
// ============================================================================

export const COLLECTIONS = {
  RESTAURANT_OWNERS: 'restaurant-owners',
  RESERVATIONS: 'reservations',
  TABLES: 'tables',
  STAFF: 'staff',
} as const;

// ============================================================================
// API Response Types
// ============================================================================

export interface FirebaseError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: FirebaseError;
}