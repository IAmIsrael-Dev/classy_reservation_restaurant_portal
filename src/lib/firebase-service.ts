/**
 * Firebase Service Layer v2.0 - No composite indexes required
 * 
 * This file provides all CRUD operations for the restaurant reservation system
 * with proper error handling and fallback values for empty/missing data.
 * All queries sort in memory to avoid Firebase composite index requirements.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// Error Type Definitions
// ============================================================================

interface FirebaseError extends Error {
  code?: string;
  message: string;
}

// Type guard to check if error is a Firebase error
function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  partySize: number;
  status: 'waiting' | 'seated' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  source: 'walk-in' | 'phone' | 'online' | 'app';
  reservationTime?: string;
  waitTime?: number;
  tableNumber?: number;
  specialRequests?: string;
  vip?: boolean;
  notified?: boolean;
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  section: string;
  position: { x: number; y: number };
  currentGuest?: string;
  shape: 'round' | 'square' | 'rectangle' | 'oval' | 'booth' | 'bar' | 'banquet' | 'semicircle' | 'triangle' | 'octagon' | 'communal' | 'high-top' | 'booth-curved' | 'u-shape' | 'l-shape';
  floorId: string;
  rotation?: number;
  scale?: number;
  reservationId?: string;
  serverId?: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  name: string;
  tableCount: number;
  layout: Table[];
  lastModified?: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  guestId: string;
  guestName: string;
  phone: string;
  message: string;
  timestamp: string;
  sent: boolean;
  template?: string;
  restaurantId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  dietary?: string[];
  popular?: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  restaurantId: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  time: string;
  partySize: number;
  status: 'waiting' | 'seated' | 'completed' | 'cancelled';
  tableId?: string;
  notes?: string;
  vip?: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TakeoutOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderTime: string;
  pickupTime: string;
  notes?: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Conversation {
  id: string;
  type: 'reservation' | 'general' | 'support' | 'ADMIN_RESTAURANT';
  reservationId: string | null;
  participants: {
    userId: string | null;
    restaurantId: string | null;
    adminIds?: string[];
  };
  participantRoles: Record<string, string>; // Map of userId/restaurantId to role (e.g., "user", "restaurant", "admin")
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  isActive: boolean;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderRole: 'USER' | 'RESTAURANT_MANAGER' | 'RESTAURANT_HOST' | 'ADMIN';
  text: string;
  messageType: 'TEXT' | 'SYSTEM';
  createdAt: string;
  isRead: boolean;
}

// ============================================================================
// Collection Names
// ============================================================================

const COLLECTIONS = {
  GUESTS: 'guests',
  TABLES: 'tables',
  FLOORS: 'floors',
  MESSAGES: 'messages',
  MENU_ITEMS: 'menu-items',
  MENU_CATEGORIES: 'menu-categories',
  RESTAURANT_OWNERS: 'restaurant-owners',
  RESERVATIONS: 'reservations',
  TAKEOUT_ORDERS: 'takeout-orders',
  CONVERSATIONS: 'conversations',
  // Note: messages are stored as a subcollection under conversations/{conversationId}/messages
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Remove undefined values from an object (Firestore doesn't accept them)
 */
const removeUndefined = <T extends object>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
};

/**
 * Safely parse Firestore document with fallback values
 */
const parseDocument = <T extends object>(doc: DocumentData, defaults: Partial<T> = {}): T => {
  return {
    id: doc.id,
    ...defaults,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as T;
};

/**
 * Get current restaurant ID from auth context
 * For now, we'll use a placeholder - this should be replaced with actual auth context
 */
const getCurrentRestaurantId = (): string => {
  // TODO: Get from auth context
  return localStorage.getItem('currentRestaurantId') || 'demo-restaurant';
};

/**
 * Remove undefined values from an object (Firestore doesn't support undefined)
 * Returns a new object with only defined values
 */
const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
};

// ============================================================================
// Guest Operations
// ============================================================================

export const guestService = {
  /**
   * Get all guests for current restaurant
   */
  async getAll(): Promise<Guest[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.GUESTS),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const guests = snapshot.docs.map(doc => parseDocument<Guest>(doc, {
        status: 'waiting',
        source: 'walk-in',
        partySize: 2,
        phone: '',
        name: 'Guest',
      }));
      
      // Sort on client side to avoid composite index requirement
      return guests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching guests:', error);
      return [];
    }
  },

  /**
   * Get single guest by ID
   */
  async getById(id: string): Promise<Guest | null> {
    try {
      const docRef = doc(db, COLLECTIONS.GUESTS, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return parseDocument<Guest>(docSnap);
    } catch (error) {
      console.error('Error fetching guest:', error);
      return null;
    }
  },

  /**
   * Create new guest
   */
  async create(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<Guest | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.GUESTS), {
        ...guestData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<Guest>(newDoc);
    } catch (error) {
      console.error('Error creating guest:', error);
      return null;
    }
  },

  /**
   * Update guest
   */
  async update(id: string, updates: Partial<Guest>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.GUESTS, id);
      const cleanedUpdates = removeUndefined({
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await updateDoc(docRef, cleanedUpdates);
      return true;
    } catch (error) {
      console.error('Error updating guest:', error);
      return false;
    }
  },

  /**
   * Delete guest
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.GUESTS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting guest:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (guests: Guest[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.GUESTS),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guests = snapshot.docs.map(doc => parseDocument<Guest>(doc, {
        status: 'waiting',
        source: 'walk-in',
        partySize: 2,
        phone: '',
        name: 'Guest',
      }));
      // Sort on client side to avoid composite index requirement
      guests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(guests);
    }, (error) => {
      console.error('Error in guest subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Table Operations
// ============================================================================

export const tableService = {
  /**
   * Get all tables for current restaurant
   */
  async getAll(): Promise<Table[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.TABLES),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const tables = snapshot.docs.map(doc => parseDocument<Table>(doc, {
        status: 'available',
        capacity: 4,
        section: 'Main',
        shape: 'round',
        floorId: 'main',
        position: { x: 0, y: 0 },
      }));
      
      // Sort on client side to avoid composite index requirement
      return tables.sort((a, b) => a.number - b.number);
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  },

  /**
   * Create new table
   */
  async create(tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<Table | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.TABLES), {
        ...tableData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<Table>(newDoc);
    } catch (error) {
      console.error('Error creating table:', error);
      return null;
    }
  },

  /**
   * Update table
   */
  async update(id: string, updates: Partial<Table>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.TABLES, id);
      const cleanedUpdates = removeUndefined({
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await updateDoc(docRef, cleanedUpdates);
      return true;
    } catch (error) {
      console.error('Error updating table:', error);
      return false;
    }
  },

  /**
   * Delete table
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.TABLES, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting table:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (tables: Table[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.TABLES),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tables = snapshot.docs.map(doc => parseDocument<Table>(doc, {
        status: 'available',
        capacity: 4,
        section: 'Main',
        shape: 'round',
        floorId: 'main',
        position: { x: 0, y: 0 },
      }));
      // Sort on client side to avoid composite index requirement
      tables.sort((a, b) => a.number - b.number);
      callback(tables);
    }, (error) => {
      console.error('Error in table subscription:', error);
      console.error('⚠️ Firestore listener failed. Check Firebase Console security rules.');
      console.error('📍 Go to: https://console.firebase.google.com/project/classyreserveai/firestore/rules');
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Floor Operations
// ============================================================================

export const floorService = {
  /**
   * Get all floors for current restaurant
   */
  async getAll(): Promise<Floor[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.FLOORS),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const floors = snapshot.docs.map(doc => parseDocument<Floor>(doc, {
        tableCount: 0,
        layout: [],
        lastModified: new Date().toISOString(),
      }));
      
      // Sort on client side to avoid composite index requirement
      return floors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (error) {
      console.error('Error fetching floors:', error);
      return [];
    }
  },

  /**
   * Create new floor
   */
  async create(floorData: Omit<Floor, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<Floor | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.FLOORS), {
        ...floorData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<Floor>(newDoc);
    } catch (error) {
      console.error('Error creating floor:', error);
      return null;
    }
  },

  /**
   * Update floor
   */
  async update(id: string, updates: Partial<Floor>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.FLOORS, id);
      const cleanedUpdates = removeUndefined({
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await updateDoc(docRef, cleanedUpdates);
      return true;
    } catch (error) {
      console.error('Error updating floor:', error);
      return false;
    }
  },

  /**
   * Delete floor
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.FLOORS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting floor:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (floors: Floor[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.FLOORS),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const floors = snapshot.docs.map(doc => parseDocument<Floor>(doc, {
        tableCount: 0,
        layout: [],
        lastModified: new Date().toISOString(),
      }));
      // Sort on client side to avoid composite index requirement
      floors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(floors);
    }, (error) => {
      console.error('Error in floor subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Message Operations
// ============================================================================

export const messageService = {
  /**
   * Get all messages for current restaurant
   */
  async getAll(): Promise<Message[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.MESSAGES),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const messages = snapshot.docs.map(doc => parseDocument<Message>(doc, {
        sent: false,
        message: '',
        phone: '',
        guestName: 'Guest',
      }));
      
      // Sort on client side to avoid composite index requirement
      return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Create new message
   */
  async create(messageData: Omit<Message, 'id' | 'restaurantId'>): Promise<Message | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), {
        ...messageData,
        restaurantId,
        timestamp: messageData.timestamp || new Date().toISOString(),
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<Message>(newDoc);
    } catch (error) {
      console.error('Error creating message:', error);
      return null;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (messages: Message[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => parseDocument<Message>(doc, {
        sent: false,
        message: '',
        phone: '',
        guestName: 'Guest',
      }));
      // Sort on client side to avoid composite index requirement
      messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(messages);
    }, (error) => {
      console.error('Error in message subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Menu Item Operations
// ============================================================================

export const menuItemService = {
  /**
   * Get all menu items for current restaurant
   */
  async getAll(): Promise<MenuItem[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.MENU_ITEMS),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => parseDocument<MenuItem>(doc, {
        available: true,
        price: 0,
        category: 'Uncategorized',
        dietary: [],
      }));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  },

  /**
   * Get menu items by category
   */
  async getByCategory(category: string): Promise<MenuItem[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.MENU_ITEMS),
        where('restaurantId', '==', restaurantId),
        where('category', '==', category),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => parseDocument<MenuItem>(doc));
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }
  },

  /**
   * Create new menu item
   */
  async create(itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<MenuItem | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.MENU_ITEMS), {
        ...itemData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<MenuItem>(newDoc);
    } catch (error) {
      console.error('Error creating menu item:', error);
      return null;
    }
  },

  /**
   * Update menu item
   */
  async update(id: string, updates: Partial<MenuItem>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.MENU_ITEMS, id);
      const cleanedUpdates = removeUndefined({
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await updateDoc(docRef, cleanedUpdates);
      return true;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return false;
    }
  },

  /**
   * Delete menu item
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.MENU_ITEMS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (items: MenuItem[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.MENU_ITEMS),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => parseDocument<MenuItem>(doc, {
        available: true,
        price: 0,
        category: 'Uncategorized',
        dietary: [],
      }));
      // Sort by category in memory
      items.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      callback(items);
    }, (error) => {
      console.error('Error in menu item subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Menu Category Operations
// ============================================================================

export const menuCategoryService = {
  /**
   * Get all menu categories for current restaurant
   */
  async getAll(): Promise<MenuCategory[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.MENU_CATEGORIES),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const categories = snapshot.docs.map(doc => parseDocument<MenuCategory>(doc));
      // Sort by order in memory
      categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      return categories;
    } catch (error) {
      console.error('Error fetching menu categories:', error);
      return [];
    }
  },

  /**
   * Create new menu category
   */
  async create(categoryData: Omit<MenuCategory, 'id' | 'createdAt' | 'restaurantId'>): Promise<MenuCategory | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.MENU_CATEGORIES), {
        ...categoryData,
        restaurantId,
        createdAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<MenuCategory>(newDoc);
    } catch (error) {
      console.error('Error creating menu category:', error);
      return null;
    }
  },

  /**
   * Update menu category
   */
  async update(id: string, updates: Partial<MenuCategory>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.MENU_CATEGORIES, id);
      await updateDoc(docRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating menu category:', error);
      return false;
    }
  },

  /**
   * Delete menu category
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.MENU_CATEGORIES, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting menu category:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (categories: MenuCategory[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.MENU_CATEGORIES),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => parseDocument<MenuCategory>(doc));
      // Sort by order in memory
      categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      callback(categories);
    }, (error) => {
      console.error('Error in menu category subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Reservation Operations
// ============================================================================

export const reservationService = {
  /**
   * Get all reservations for current restaurant
   */
  async getAll(): Promise<Reservation[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.RESERVATIONS),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      const reservations = snapshot.docs.map(doc => parseDocument<Reservation>(doc));
      // Sort by time in memory to avoid index requirement
      return reservations.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  },

  /**
   * Get reservation by ID
   */
  async getById(id: string): Promise<Reservation | null> {
    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return parseDocument<Reservation>(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching reservation:', error);
      return null;
    }
  },

  /**
   * Create new reservation
   */
  async create(reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<Reservation | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.RESERVATIONS), {
        ...reservationData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<Reservation>(newDoc);
    } catch (error) {
      console.error('Error creating reservation:', error);
      return null;
    }
  },

  /**
   * Update reservation
   */
  async update(id: string, updates: Partial<Reservation>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error updating reservation:', error);
      return false;
    }
  },

  /**
   * Delete reservation
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting reservation:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (reservations: Reservation[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.RESERVATIONS),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservations = snapshot.docs.map(doc => parseDocument<Reservation>(doc));
      // Sort by time in memory to avoid index requirement
      reservations.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      callback(reservations);
    }, (error) => {
      console.error('Error in reservation subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Takeout Order Operations
// ============================================================================

export const takeoutOrderService = {
  /**
   * Get all takeout orders for current restaurant
   */
  async getAll(): Promise<TakeoutOrder[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.TAKEOUT_ORDERS),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => parseDocument<TakeoutOrder>(doc));
      // Sort by orderTime in memory to avoid index requirement
      return orders.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
    } catch (error) {
      console.error('Error fetching takeout orders:', error);
      return [];
    }
  },

  /**
   * Get takeout order by ID
   */
  async getById(id: string): Promise<TakeoutOrder | null> {
    try {
      const docRef = doc(db, COLLECTIONS.TAKEOUT_ORDERS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return parseDocument<TakeoutOrder>(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching takeout order:', error);
      return null;
    }
  },

  /**
   * Create new takeout order
   */
  async create(orderData: Omit<TakeoutOrder, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<TakeoutOrder | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, COLLECTIONS.TAKEOUT_ORDERS), {
        ...orderData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<TakeoutOrder>(newDoc);
    } catch (error) {
      console.error('Error creating takeout order:', error);
      return null;
    }
  },

  /**
   * Update takeout order
   */
  async update(id: string, updates: Partial<TakeoutOrder>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.TAKEOUT_ORDERS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error updating takeout order:', error);
      return false;
    }
  },

  /**
   * Delete takeout order
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.TAKEOUT_ORDERS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting takeout order:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (orders: TakeoutOrder[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    const q = query(
      collection(db, COLLECTIONS.TAKEOUT_ORDERS),
      where('restaurantId', '==', restaurantId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => parseDocument<TakeoutOrder>(doc));
      // Sort by orderTime in memory to avoid index requirement
      orders.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
      callback(orders);
    }, (error) => {
      console.error('Error in takeout order subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Conversation Operations
// ============================================================================

export const conversationService = {
  /**
   * Get all conversations for current restaurant
   */
  async getAll(): Promise<Conversation[]> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const q = query(
        collection(db, COLLECTIONS.CONVERSATIONS),
        where('restaurantId', '==', restaurantId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const conversations = snapshot.docs.map(doc => parseDocument<Conversation>(doc, {
        isActive: true,
      }));
      
      // Sort on client side to avoid composite index requirement
      return conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Get single conversation by ID
   */
  async getById(id: string): Promise<Conversation | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CONVERSATIONS, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return parseDocument<Conversation>(docSnap);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  },

  /**
   * Create new conversation
   */
  async create(conversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>): Promise<Conversation | null> {
    try {
      const restaurantId = getCurrentRestaurantId();
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
        ...conversationData,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<Conversation>(newDoc);
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  /**
   * Update conversation
   */
  async update(id: string, updates: Partial<Conversation>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.CONVERSATIONS, id);
      const cleanedUpdates = removeUndefined({
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await updateDoc(docRef, cleanedUpdates);
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
  },

  /**
   * Delete conversation
   */
  async delete(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.CONVERSATIONS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (conversations: Conversation[]) => void): () => void {
    const restaurantId = getCurrentRestaurantId();
    console.log('🔍 [ConversationService] Subscribing to conversations for restaurantId:', restaurantId);
    
    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where('participants.restaurantId', '==', restaurantId)  // Fixed: query nested field
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📩 [ConversationService] Received snapshot with', snapshot.size, 'conversations');
      
      if (snapshot.empty) {
        console.log('⚠️ [ConversationService] No conversations found for restaurantId:', restaurantId);
        callback([]);
        return;
      }
      
      const conversations = snapshot.docs.map(doc => {
        const data = parseDocument<Conversation>(doc, {
          isActive: true,
        });
        console.log('💬 [ConversationService] Conversation:', doc.id, data);
        return data;
      });
      
      // Sort on client side to avoid composite index requirement
      conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      callback(conversations);
    }, (error) => {
      console.error('❌ [ConversationService] Error in conversation subscription:', error);
      console.error('📍 Error code:', error.code);
      console.error('📍 Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('🚨 PERMISSION DENIED: Check Firestore security rules!');
        console.error('📖 Go to: https://console.firebase.google.com/project/classyreserveai/firestore/rules');
      }
      
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Conversation Message Operations (Subcollection)
// ============================================================================

export const conversationMessageService = {
  /**
   * Get all messages for a specific conversation
   */
  async getAllForConversation(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      if (snapshot.empty) {
        return [];
      }
      
      const messages = snapshot.docs.map(doc => parseDocument<ConversationMessage>(doc, {
        isRead: false,
        messageType: 'TEXT',
      }));
      
      // Sort on client side to avoid composite index requirement
      return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  },

  /**
   * Get single conversation message by ID
   */
  async getById(conversationId: string, messageId: string): Promise<ConversationMessage | null> {
    try {
      const messageRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId);
      const docSnap = await getDoc(messageRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return parseDocument<ConversationMessage>(docSnap);
    } catch (error) {
      console.error('Error fetching conversation message:', error);
      return null;
    }
  },

  /**
   * Create new conversation message in subcollection
   */
  async create(conversationId: string, messageData: Omit<ConversationMessage, 'id'>): Promise<ConversationMessage | null> {
    try {
      const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
      const now = Timestamp.now();
      
      const docRef = await addDoc(messagesRef, {
        ...messageData,
        createdAt: now,
      });
      
      const newDoc = await getDoc(docRef);
      return parseDocument<ConversationMessage>(newDoc);
    } catch (error) {
      console.error('Error creating conversation message:', error);
      return null;
    }
  },

  /**
   * Update conversation message
   */
  async update(conversationId: string, messageId: string, updates: Partial<ConversationMessage>): Promise<boolean> {
    try {
      const messageRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId);
      const cleanedUpdates = removeUndefined(updates);
      await updateDoc(messageRef, cleanedUpdates);
      return true;
    } catch (error) {
      console.error('Error updating conversation message:', error);
      return false;
    }
  },

  /**
   * Delete conversation message
   */
  async delete(conversationId: string, messageId: string): Promise<boolean> {
    try {
      const messageRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId);
      await deleteDoc(messageRef);
      return true;
    } catch (error) {
      console.error('Error deleting conversation message:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time updates for a specific conversation
   */
  subscribeToConversation(conversationId: string, callback: (messages: ConversationMessage[]) => void): () => void {
    console.log('🔍 [MessageService] Subscribing to messages for conversationId:', conversationId);
    
    const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
    
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      console.log('📨 [MessageService] Received snapshot with', snapshot.size, 'messages for conversation:', conversationId);
      
      const messages = snapshot.docs.map(doc => {
        const data = parseDocument<ConversationMessage>(doc, {
          isRead: false,
          messageType: 'TEXT',
        });
        console.log('💬 [MessageService] Message:', doc.id, data);
        return data;
      });
      
      // Sort on client side to avoid composite index requirement
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      callback(messages);
    }, (error) => {
      console.error('❌ [MessageService] Error in conversation message subscription:', error);
      console.error('📍 Error code:', error.code);
      console.error('📍 Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('🚨 PERMISSION DENIED: Check Firestore security rules!');
        console.error('📖 Go to: https://console.firebase.google.com/project/classyreserveai/firestore/rules');
      }
      
      callback([]);
    });
    
    return unsubscribe;
  }
};

// ============================================================================
// Restaurant Search & Host Management Operations
// ============================================================================

export interface AuthorizedHost {
  email: string;
  name: string;
  status: 'active' | 'inactive';
  addedAt?: unknown;
  addedBy?: string;
  masterPassword?: string;
}

export interface RestaurantData {
  restaurantName: string;
  cuisineType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  capacity?: number;
  description?: string;
  website?: string;
  openingHours?: OpeningHours;
  photos?: string[];
  managerEmail?: string;
  managerPasswordHash?: string;
  managerMasterPassword?: string;
  hasCompletedOnboarding?: boolean;
  authorizedHosts?: AuthorizedHost[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RestaurantSearchResult {
  id: string;
  restaurantName: string;
  cuisineType: string;
  city: string;
  state: string;
  authorizedHosts?: AuthorizedHost[];
  managerEmail?: string;
  managerPasswordHash?: string;
  managerMasterPassword?: string;
}

interface OpeningHours {
  [key: string]: { open: string; close: string } | 'closed';
}

export const restaurantSearchService = {
  /**
   * Search restaurants by name
   */
  async searchByName(searchTerm: string): Promise<RestaurantSearchResult[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const searchLower = searchTerm.toLowerCase().trim();
      
      // Get all restaurants and filter in memory
      // Note: Firestore doesn't support case-insensitive or "contains" queries
      const snapshot = await getDocs(collection(db, COLLECTIONS.RESTAURANT_OWNERS));
      
      if (snapshot.empty) {
        return [];
      }

      const results: RestaurantSearchResult[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const restaurantName = (data.restaurantName || '').toLowerCase();
        
        // Check if restaurant name contains search term
        if (restaurantName.includes(searchLower)) {
          results.push({
            id: doc.id,
            restaurantName: data.restaurantName || 'Unknown Restaurant',
            cuisineType: data.cuisineType || 'Not specified',
            city: data.city || '',
            state: data.state || '',
            authorizedHosts: data.authorizedHosts || [],
            managerEmail: data.managerEmail,
            managerPasswordHash: data.managerPasswordHash,
            managerMasterPassword: data.managerMasterPassword,
          });
        }
      });

      return results.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  },

  /**
   * Get default restaurants (first 5)
   */
  async getDefaultRestaurants(): Promise<RestaurantSearchResult[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.RESTAURANT_OWNERS));
      
      if (snapshot.empty) {
        return [];
      }

      const results: RestaurantSearchResult[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          restaurantName: data.restaurantName || 'Unknown Restaurant',
          cuisineType: data.cuisineType || 'Not specified',
          city: data.city || '',
          state: data.state || '',
          authorizedHosts: data.authorizedHosts || [],
          managerEmail: data.managerEmail,
          managerPasswordHash: data.managerPasswordHash,
          managerMasterPassword: data.managerMasterPassword,
        });
      });

      return results.slice(0, 5); // Return first 5 restaurants
    } catch (error) {
      console.error('Error getting default restaurants:', error);
      return [];
    }
  },

  /**
   * Get restaurant by ID
   */
  async getById(restaurantId: string): Promise<RestaurantSearchResult | null> {
    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        restaurantName: data.restaurantName || 'Unknown Restaurant',
        cuisineType: data.cuisineType || 'Not specified',
        city: data.city || '',
        state: data.state || '',
        authorizedHosts: data.authorizedHosts || [],
        managerEmail: data.managerEmail,
        managerPasswordHash: data.managerPasswordHash,
        managerMasterPassword: data.managerMasterPassword,
      };
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return null;
    }
  },

  /**
   * Get complete restaurant data by ID (returns all fields)
   */
  async getRestaurantDataById(restaurantId: string): Promise<RestaurantData | null> {
    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        restaurantName: data.restaurantName || 'Unknown Restaurant',
        cuisineType: data.cuisineType || 'Not specified',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        phone: data.phone || '',
        capacity: data.capacity,
        description: data.description,
        website: data.website,
        openingHours: data.openingHours,
        photos: data.photos,
        managerEmail: data.managerEmail,
        managerPasswordHash: data.managerPasswordHash,
        managerMasterPassword: data.managerMasterPassword,
        hasCompletedOnboarding: data.hasCompletedOnboarding,
        authorizedHosts: data.authorizedHosts || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error('Error getting restaurant data:', error);
      return null;
    }
  },

  /**
   * Update restaurant profile data by restaurant ID (for custom auth)
   */
  async updateRestaurantData(restaurantId: string, updates: Partial<RestaurantData>): Promise<boolean> {
    try {
      console.log('[Firebase] Updating restaurant data for ID:', restaurantId);
      console.log('[Firebase] Updates:', updates);
      
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      console.log('[Firebase] Restaurant data updated successfully');
      return true;
    } catch (error: unknown) {
      if (isFirebaseError(error)) {
        console.error('[Firebase] ❌ Error updating restaurant data:', error);
        console.error('[Firebase] Error code:', error.code);
        console.error('[Firebase] Error message:', error.message);
        
        if (error.code === 'permission-denied') {
          console.error('🚨 PERMISSION DENIED: Firebase security rules are blocking this write operation!');
          console.error('📖 This happens because custom auth (master password) does not create a Firebase user.');
          console.error('📍 You need to update your Firestore security rules to allow writes to restaurant-owners collection.');
          console.error('🔗 Go to: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules');
        }
      } else {
        console.error('[Firebase] ❌ Unknown error updating restaurant data:', error);
      }
      
      return false;
    }
  },

  /**
   * Verify if a host email is authorized for a restaurant
   */
  async verifyHostEmail(restaurantId: string, hostEmail: string): Promise<boolean> {
    try {
      const restaurant = await this.getById(restaurantId);
      
      if (!restaurant || !restaurant.authorizedHosts) {
        return false;
      }

      return restaurant.authorizedHosts.some(
        host => host.email.toLowerCase() === hostEmail.toLowerCase() && host.status === 'active'
      );
    } catch (error) {
      console.error('Error verifying host email:', error);
      return false;
    }
  },

  /**
   * Add a host to restaurant's authorized hosts
   */
  async addHost(restaurantId: string, hostData: { email: string; name: string; addedBy: string; masterPassword?: string }): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error('Restaurant not found');
        return false;
      }

      const currentHosts = docSnap.data().authorizedHosts || [];
      
      // Check if email already exists
      const emailExists = currentHosts.some(
        (host: AuthorizedHost) => host.email.toLowerCase() === hostData.email.toLowerCase()
      );

      if (emailExists) {
        console.error('Host email already exists');
        return false;
      }

      const newHost = {
        email: hostData.email,
        name: hostData.name,
        addedAt: Timestamp.now(),
        addedBy: hostData.addedBy,
        status: 'active',
        masterPassword: hostData.masterPassword, // Store master password
      };

      await updateDoc(docRef, {
        authorizedHosts: [...currentHosts, newHost],
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error('Error adding host:', error);
      return false;
    }
  },

  /**
   * Remove a host from restaurant's authorized hosts
   */
  async removeHost(restaurantId: string, hostEmail: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return false;
      }

      const currentHosts = docSnap.data().authorizedHosts || [];
      const updatedHosts = currentHosts.filter(
        (host: AuthorizedHost) => host.email.toLowerCase() !== hostEmail.toLowerCase()
      );

      await updateDoc(docRef, {
        authorizedHosts: updatedHosts,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error('Error removing host:', error);
      return false;
    }
  },

  /**
   * Update host status (active/inactive)
   */
  async updateHostStatus(restaurantId: string, hostEmail: string, status: 'active' | 'inactive'): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return false;
      }

      const currentHosts = docSnap.data().authorizedHosts || [];
      const updatedHosts = currentHosts.map((host: AuthorizedHost) => {
        if (host.email.toLowerCase() === hostEmail.toLowerCase()) {
          return { ...host, status };
        }
        return host;
      });

      await updateDoc(docRef, {
        authorizedHosts: updatedHosts,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error('Error updating host status:', error);
      return false;
    }
  },

  /**
   * Verify host credentials (email + master password) for a specific restaurant
   */
  async verifyHostCredentials(restaurantId: string, hostEmail: string, masterPassword: string): Promise<{ verified: boolean; hostName?: string; hostData?: AuthorizedHost; role?: 'host' | 'manager' }> {
    try {
      const restaurant = await this.getById(restaurantId);
      
      if (!restaurant) {
        console.log('[Auth Debug] Restaurant not found for ID:', restaurantId);
        return { verified: false };
      }

      console.log('[Auth Debug] Restaurant found:', restaurant.restaurantName);
      console.log('[Auth Debug] Manager email:', restaurant.managerEmail);
      console.log('[Auth Debug] Attempting email:', hostEmail);
      console.log('[Auth Debug] Has password hash:', !!restaurant.managerPasswordHash);
      console.log('[Auth Debug] Has master password:', !!restaurant.managerMasterPassword);

      // Check if it's the manager trying to sign in
      if (restaurant.managerEmail && restaurant.managerEmail.toLowerCase() === hostEmail.toLowerCase()) {
        
        // FIRST: Try normal password (created during signup)
        if (restaurant.managerPasswordHash) {
          console.log('[Auth Debug] Checking normal password first...');
          console.log('[Auth Debug] Stored hash:', restaurant.managerPasswordHash);
          console.log('[Auth Debug] Password to verify:', masterPassword);
          const { verifyPassword } = await import('./password-utils');
          const isValidPassword = await verifyPassword(masterPassword, restaurant.managerPasswordHash);
          
          console.log('[Auth Debug] Normal password valid:', isValidPassword);
          
          if (isValidPassword) {
            console.log('[Auth Debug] ✅ Manager authenticated with normal password');
            return { 
              verified: true, 
              hostName: restaurant.restaurantName + ' Manager',
              role: 'manager'
            };
          }
        }

        // SECOND: If normal password failed, try master password as fallback
        if (restaurant.managerMasterPassword === masterPassword) {
          console.log('[Auth Debug] ✅ Manager authenticated with master password');
          return { 
            verified: true, 
            hostName: restaurant.restaurantName + ' Manager',
            role: 'manager'
          };
        }

        console.log('[Auth Debug] ❌ Manager authentication failed - neither password matched');
      }

      // Check if it's a host
      if (restaurant.authorizedHosts) {
        const host = restaurant.authorizedHosts.find(
          h => h.email.toLowerCase() === hostEmail.toLowerCase() && 
               h.status === 'active' &&
               h.masterPassword === masterPassword
        );

        if (host) {
          console.log('[Auth Debug] ✅ Host authenticated');
          return { 
            verified: true, 
            hostName: host.name,
            hostData: host,
            role: 'host'
          };
        }
      }

      console.log('[Auth Debug] ❌ Authentication failed - no matching credentials');
      return { verified: false };
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return { verified: false };
    }
  },

  /**
   * Update manager's master password
   */
  async updateManagerMasterPassword(restaurantId: string, managerEmail: string, masterPassword: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANT_OWNERS, restaurantId);
      
      await updateDoc(docRef, {
        managerEmail,
        managerMasterPassword: masterPassword,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error('Error updating manager master password:', error);
      return false;
    }
  },

  /**
   * Generate a random master password
   */
  generateMasterPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 16;
    let password = '';
    
    // Use crypto.getRandomValues for better randomness
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }
    
    return password;
  },

  /**
   * Create a new restaurant account with email and password (without Firebase Auth)
   */
  async createRestaurantAccount(
    email: string, 
    passwordHash: string, 
    restaurantData: {
      restaurantName: string;
      cuisineType: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      phone: string;
      capacity?: number;
      description?: string;
      website?: string;
      openingHours?: OpeningHours;
      photos?: string[];
    }
  ): Promise<{ success: boolean; restaurantId?: string; masterPassword?: string; error?: string }> {
    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, COLLECTIONS.RESTAURANT_OWNERS),
        where('managerEmail', '==', email.toLowerCase())
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        return { success: false, error: 'Email already exists' };
      }

      // Generate master password
      const masterPassword = this.generateMasterPassword();

      // Remove undefined fields from restaurantData (Firestore doesn't support undefined values)
      const cleanedData = removeUndefinedFields(restaurantData);

      // Create restaurant profile
      const restaurantRef = await addDoc(collection(db, COLLECTIONS.RESTAURANT_OWNERS), {
        ...cleanedData,
        managerEmail: email.toLowerCase(),
        managerPasswordHash: passwordHash,
        managerMasterPassword: masterPassword,
        hasCompletedOnboarding: true,
        authorizedHosts: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return { 
        success: true, 
        restaurantId: restaurantRef.id,
        masterPassword: masterPassword,
      };
    } catch (error) {
      console.error('Error creating restaurant account:', error);
      return { success: false, error: 'Failed to create account' };
    }
  },

  /**
   * Sign in with email and password (checks both master password and normal password)
   */
  async signInWithEmailAndPassword(
    restaurantName: string,
    email: string,
    password: string
  ): Promise<{ 
    success: boolean; 
    restaurantId?: string; 
    restaurantData?: RestaurantData;
    role?: 'manager' | 'host';
    userName?: string;
    masterPassword?: string;
    error?: string;
  }> {
    try {
      // Search for restaurant by name
      const restaurantQuery = query(
        collection(db, COLLECTIONS.RESTAURANT_OWNERS),
        where('restaurantName', '>=', restaurantName),
        where('restaurantName', '<=', restaurantName + '\uf8ff'),
        limit(1)
      );
      const restaurantSnapshot = await getDocs(restaurantQuery);

      if (restaurantSnapshot.empty) {
        return { success: false, error: 'Restaurant not found' };
      }

      const restaurantDoc = restaurantSnapshot.docs[0];
      const restaurantData = restaurantDoc.data() as RestaurantData;
      const restaurantId = restaurantDoc.id;

      // Check if it's the manager signing in with master password
      if (restaurantData.managerEmail?.toLowerCase() === email.toLowerCase() && 
          restaurantData.managerMasterPassword === password) {
        return {
          success: true,
          restaurantId,
          restaurantData,
          role: 'manager',
          userName: restaurantData.restaurantName + ' Manager',
          masterPassword: restaurantData.managerMasterPassword,
        };
      }

      // Check if it's the manager signing in with normal password
      if (restaurantData.managerEmail?.toLowerCase() === email.toLowerCase() && 
          restaurantData.managerPasswordHash) {
        // Import password verification
        const { verifyPassword } = await import('./password-utils');
        const isValidPassword = await verifyPassword(password, restaurantData.managerPasswordHash);
        
        if (isValidPassword) {
          return {
            success: true,
            restaurantId,
            restaurantData,
            role: 'manager',
            userName: restaurantData.restaurantName + ' Manager',
            masterPassword: restaurantData.managerMasterPassword,
          };
        }
      }

      // Check if it's a host signing in with master password
      if (restaurantData.authorizedHosts) {
        const host = restaurantData.authorizedHosts.find(
          (h: AuthorizedHost) => h.email.toLowerCase() === email.toLowerCase() && 
                     h.status === 'active' &&
                     h.masterPassword === password
        );

        if (host) {
          return {
            success: true,
            restaurantId,
            restaurantData,
            role: 'host',
            userName: host.name,
          };
        }
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  },
};

// ============================================================================
// Export all services
// ============================================================================

export const firebaseService = {
  guests: guestService,
  tables: tableService,
  floors: floorService,
  messages: messageService,
  menuItems: menuItemService,
  menuCategories: menuCategoryService,
  reservations: reservationService,
  takeoutOrders: takeoutOrderService,
  conversations: conversationService,
  conversationMessages: conversationMessageService,
  restaurants: restaurantSearchService,
};

export default firebaseService;