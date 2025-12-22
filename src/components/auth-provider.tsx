/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { 
  signInWithGoogle as googleSignIn,
  signInWithEmail as emailSignIn,
  signUpWithEmail as emailSignUp,
  logout as authLogout,
  getRestaurantProfile,
  updateRestaurantProfile as updateProfile,
  initializeUserProfile
} from '../lib/firebase-auth';
import { restaurantSearchService } from '../lib/firebase-service';
import type { AuthContextType, RestaurantProfile } from '../lib/types';

// Helper function to convert Firebase Timestamp to Date
function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  
  // Type guard for objects with toDate method
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    const obj = timestamp as { toDate?: unknown };
    if (typeof obj.toDate === 'function') {
      return obj.toDate();
    }
  }
  
  // Type guard for objects with seconds property (plain Timestamp object)
  if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
    const obj = timestamp as { seconds?: unknown };
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000);
    }
  }
  
  return new Date();
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'manager' | 'host' | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Role detection function
  const detectUserRole = async (user: User): Promise<'manager' | 'host' | null> => {
    try {
      // Check if user is a manager (has a restaurant profile)
      const profile = await getRestaurantProfile(user.uid);
      if (profile && profile.hasCompletedOnboarding) {
        return 'manager';
      }

      // Check if user is a host (email exists in any restaurant's authorizedHosts)
      const restaurants = await restaurantSearchService.searchByName(''); // Get all restaurants
      for (const restaurant of restaurants) {
        const isAuthorized = await restaurantSearchService.verifyHostEmail(
          restaurant.id,
          user.email || ''
        );
        if (isAuthorized) {
          // Store the restaurant ID for the host
          setSelectedRestaurantId(restaurant.id);
          return 'host';
        }
      }

      // No role detected yet
      return null;
    } catch (error) {
      console.error('Error detecting user role:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch restaurant profile from Firestore
        const profile = await getRestaurantProfile(user.uid);
        
        if (profile) {
          setRestaurantProfile(profile);
        } else {
          // Create initial profile
          const initialProfile: RestaurantProfile = await initializeUserProfile(user);
          setRestaurantProfile(initialProfile);
        }

        // Detect user role
        const role = await detectUserRole(user);
        setUserRole(role);
      } else {
        setRestaurantProfile(null);
        setUserRole(null);
        setSelectedRestaurantId(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load restaurant profile when selectedRestaurantId changes (for custom auth)
  useEffect(() => {
    const loadRestaurantProfile = async () => {
      if (selectedRestaurantId && !user) {
        console.log('[Auth] Loading restaurant profile for custom auth, restaurant ID:', selectedRestaurantId);
        try {
          // Get complete restaurant data from the restaurant-owners collection
          const restaurantData = await restaurantSearchService.getRestaurantDataById(selectedRestaurantId);
          
          if (restaurantData) {
            console.log('[Auth] Restaurant data loaded:', restaurantData);
            
            // Convert restaurant data to RestaurantProfile format
            const profile: RestaurantProfile = {
              displayName: restaurantData.restaurantName || 'Manager', // Use restaurant name as display name
              email: restaurantData.managerEmail || '',
              restaurantName: restaurantData.restaurantName,
              cuisineType: restaurantData.cuisineType,
              phone: restaurantData.phone,
              address: restaurantData.address,
              city: restaurantData.city,
              state: restaurantData.state,
              zipCode: restaurantData.zipCode,
              hasCompletedOnboarding: restaurantData.hasCompletedOnboarding || true,
              createdAt: toDate(restaurantData.createdAt),
              updatedAt: toDate(restaurantData.updatedAt),
              // Optional fields
              description: restaurantData.description,
              website: restaurantData.website,
              capacity: restaurantData.capacity,
              openingHours: restaurantData.openingHours,
              photos: restaurantData.photos,
              authorizedHosts: restaurantData.authorizedHosts?.map(host => ({
                email: host.email,
                name: host.name,
                addedAt: toDate(host.addedAt),
                addedBy: host.addedBy || '',
                status: host.status || 'active',
              })),
            };
            
            setRestaurantProfile(profile);
            console.log('[Auth] Restaurant profile set:', profile);
          } else {
            console.error('[Auth] Restaurant not found for ID:', selectedRestaurantId);
          }
        } catch (error) {
          console.error('[Auth] Error loading restaurant profile:', error);
        }
      }
    };
    
    loadRestaurantProfile();
  }, [selectedRestaurantId, user]);

  const signInWithGoogle = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const user = await emailSignIn(email, password);
      
      // Initialize profile if it doesn't exist (similar to Google sign-in)
      const profile = await getRestaurantProfile(user.uid);
      if (!profile) {
        const initialProfile = await initializeUserProfile(user);
        setRestaurantProfile(initialProfile);
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const user = await emailSignUp(email, password, displayName);
      
      // Initialize profile
      const initialProfile = await initializeUserProfile(user);
      setRestaurantProfile(initialProfile);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateRestaurantProfile = async (profileUpdates: Partial<RestaurantProfile>) => {
    if (!user) return;
    
    try {
      const updatedProfile = {
        ...profileUpdates,
        updatedAt: new Date(), // ✅ Changed from toISOString() to Date object
      };
      
      await updateProfile(user.uid, updatedProfile);
      
      // Update local state
      setRestaurantProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
    } catch (error) {
      console.error('Error updating restaurant profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    restaurantProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateRestaurantProfile,
    userRole,
    selectedRestaurantId,
    setSelectedRestaurantId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}