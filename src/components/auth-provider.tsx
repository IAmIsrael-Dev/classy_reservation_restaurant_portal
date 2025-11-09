/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
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
import type { AuthContextType, RestaurantProfile } from '../lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        setRestaurantProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      await emailSignIn(email, password);
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