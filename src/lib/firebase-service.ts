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
  Timestamp,
  onSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

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
  shape: 'round' | 'square' | 'rectangle';
  floor: 'ground' | 'main' | 'upper' | 'rooftop';
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

// ============================================================================
// Collection Names
// ============================================================================

const COLLECTIONS = {
  GUESTS: 'guests',
  TABLES: 'tables',
  MESSAGES: 'messages',
  MENU_ITEMS: 'menu-items',
  MENU_CATEGORIES: 'menu-categories',
  RESTAURANT_OWNERS: 'restaurant-owners',
  RESERVATIONS: 'reservations',
  TAKEOUT_ORDERS: 'takeout-orders',
};

// ============================================================================
// Helper Functions
// ============================================================================

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
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => parseDocument<Guest>(doc, {
        status: 'waiting',
        source: 'walk-in',
        partySize: 2,
        phone: '',
        name: 'Guest',
      }));
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
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
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
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guests = snapshot.docs.map(doc => parseDocument<Guest>(doc, {
        status: 'waiting',
        source: 'walk-in',
        partySize: 2,
        phone: '',
        name: 'Guest',
      }));
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
        where('restaurantId', '==', restaurantId),
        orderBy('number', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => parseDocument<Table>(doc, {
        status: 'available',
        capacity: 4,
        section: 'Main',
        shape: 'round',
        floor: 'main',
        position: { x: 0, y: 0 },
      }));
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
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
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
      where('restaurantId', '==', restaurantId),
      orderBy('number', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tables = snapshot.docs.map(doc => parseDocument<Table>(doc, {
        status: 'available',
        capacity: 4,
        section: 'Main',
        shape: 'round',
        floor: 'main',
        position: { x: 0, y: 0 },
      }));
      callback(tables);
    }, (error) => {
      console.error('Error in table subscription:', error);
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
        where('restaurantId', '==', restaurantId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => parseDocument<Message>(doc, {
        sent: false,
        message: '',
        phone: '',
        guestName: 'Guest',
      }));
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
      where('restaurantId', '==', restaurantId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => parseDocument<Message>(doc, {
        sent: false,
        message: '',
        phone: '',
        guestName: 'Guest',
      }));
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
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
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
// Export all services
// ============================================================================

export const firebaseService = {
  guests: guestService,
  tables: tableService,
  messages: messageService,
  menuItems: menuItemService,
  menuCategories: menuCategoryService,
  reservations: reservationService,
  takeoutOrders: takeoutOrderService,
};

export default firebaseService;