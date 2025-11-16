/**
 * Custom React hooks for Firebase operations
 * These hooks integrate with the auth context and provide real-time data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth-provider';
import {
  guestService,
  tableService,
  messageService,
  menuItemService,
  menuCategoryService,
  reservationService,
  takeoutOrderService,
  type Guest,
  type Table,
  type Message,
  type MenuItem,
  type MenuCategory,
  type Reservation,
  type TakeoutOrder,
} from './firebase-service';

// Set restaurant ID in localStorage when auth context is available
export function useRestaurantId() {
  const { user, restaurantProfile } = useAuth();
  
  useEffect(() => {
    if (user && restaurantProfile) {
      // Use the user's UID as the restaurant ID
      localStorage.setItem('currentRestaurantId', user.uid);
    }
  }, [user, restaurantProfile]);
  
  return user?.uid || 'demo-restaurant';
}

// ============================================================================
// Guest Hooks
// ============================================================================

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId(); // Ensure restaurant ID is set
  
  // Load guests on mount
  useEffect(() => {
    loadGuests();
  }, []);
  
  const loadGuests = async () => {
    try {
      setLoading(true);
      const data = await guestService.getAll();
      setGuests(data);
      setError(null);
    } catch (err) {
      setError('Failed to load guests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = guestService.subscribe((data) => {
      setGuests(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createGuest = useCallback(async (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    const guest = await guestService.create(guestData);
    if (guest) {
      // Real-time subscription will update the state
      return guest;
    }
    throw new Error('Failed to create guest');
  }, []);
  
  const updateGuest = useCallback(async (id: string, updates: Partial<Guest>) => {
    const success = await guestService.update(id, updates);
    if (!success) {
      throw new Error('Failed to update guest');
    }
  }, []);
  
  const deleteGuest = useCallback(async (id: string) => {
    const success = await guestService.delete(id);
    if (!success) {
      throw new Error('Failed to delete guest');
    }
  }, []);
  
  return {
    guests,
    loading,
    error,
    createGuest,
    updateGuest,
    deleteGuest,
    refresh: loadGuests,
  };
}

// ============================================================================
// Table Hooks
// ============================================================================

export function useTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId();
  
  // Load tables on mount
  useEffect(() => {
    loadTables();
  }, []);
  
  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await tableService.getAll();
      setTables(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tables');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = tableService.subscribe((data) => {
      setTables(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createTable = useCallback(async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    const table = await tableService.create(tableData);
    if (table) {
      return table;
    }
    throw new Error('Failed to create table');
  }, []);
  
  const updateTable = useCallback(async (id: string, updates: Partial<Table>) => {
    const success = await tableService.update(id, updates);
    if (!success) {
      throw new Error('Failed to update table');
    }
  }, []);
  
  const deleteTable = useCallback(async (id: string) => {
    const success = await tableService.delete(id);
    if (!success) {
      throw new Error('Failed to delete table');
    }
  }, []);
  
  return {
    tables,
    loading,
    error,
    createTable,
    updateTable,
    deleteTable,
    refresh: loadTables,
  };
}

// ============================================================================
// Message Hooks
// ============================================================================

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId();
  
  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);
  
  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getAll();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = messageService.subscribe((data) => {
      setMessages(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'restaurantId'>) => {
    const message = await messageService.create(messageData);
    if (message) {
      return message;
    }
    throw new Error('Failed to send message');
  }, []);
  
  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh: loadMessages,
  };
}

// ============================================================================
// Menu Item Hooks
// ============================================================================

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId();
  
  // Load menu items on mount
  useEffect(() => {
    loadMenuItems();
  }, []);
  
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const data = await menuItemService.getAll();
      setMenuItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to load menu items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = menuItemService.subscribe((data) => {
      setMenuItems(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    const item = await menuItemService.create(itemData);
    if (item) {
      return item;
    }
    throw new Error('Failed to create menu item');
  }, []);
  
  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    const success = await menuItemService.update(id, updates);
    if (!success) {
      throw new Error('Failed to update menu item');
    }
  }, []);
  
  const deleteMenuItem = useCallback(async (id: string) => {
    const success = await menuItemService.delete(id);
    if (!success) {
      throw new Error('Failed to delete menu item');
    }
  }, []);
  
  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refresh: loadMenuItems,
  };
}

// ============================================================================
// Menu Category Hooks
// ============================================================================

export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId();
  
  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await menuCategoryService.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = menuCategoryService.subscribe((data) => {
      setCategories(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createCategory = useCallback(async (categoryData: Omit<MenuCategory, 'id' | 'createdAt' | 'restaurantId'>) => {
    const category = await menuCategoryService.create(categoryData);
    if (category) {
      return category;
    }
    throw new Error('Failed to create category');
  }, []);
  
  const updateCategory = useCallback(async (id: string, updates: Partial<MenuCategory>) => {
    const success = await menuCategoryService.update(id, updates);
    if (!success) {
      throw new Error('Failed to update category');
    }
  }, []);
  
  const deleteCategory = useCallback(async (id: string) => {
    const success = await menuCategoryService.delete(id);
    if (!success) {
      throw new Error('Failed to delete category');
    }
  }, []);
  
  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: loadCategories,
  };
}

// ============================================================================
// Reservation Hooks
// ============================================================================

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId();
  
  // Load reservations on mount
  useEffect(() => {
    loadReservations();
  }, []);
  
  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getAll();
      setReservations(data);
      setError(null);
    } catch (err) {
      setError('Failed to load reservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = reservationService.subscribe((data) => {
      setReservations(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createReservation = useCallback(async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    const reservation = await reservationService.create(reservationData);
    if (reservation) {
      return reservation;
    }
    throw new Error('Failed to create reservation');
  }, []);
  
  const updateReservation = useCallback(async (id: string, updates: Partial<Reservation>) => {
    const success = await reservationService.update(id, updates);
    if (!success) {
      throw new Error('Failed to update reservation');
    }
  }, []);
  
  const deleteReservation = useCallback(async (id: string) => {
    const success = await reservationService.delete(id);
    if (!success) {
      throw new Error('Failed to delete reservation');
    }
  }, []);
  
  return {
    reservations,
    loading,
    error,
    createReservation,
    updateReservation,
    deleteReservation,
    refresh: loadReservations,
  };
}

// ============================================================================
// Takeout Order Hooks
// ============================================================================

export function useTakeoutOrders() {
  const [takeoutOrders, setTakeoutOrders] = useState<TakeoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRestaurantId();
  
  // Load takeout orders on mount
  useEffect(() => {
    loadTakeoutOrders();
  }, []);
  
  const loadTakeoutOrders = async () => {
    try {
      setLoading(true);
      const data = await takeoutOrderService.getAll();
      setTakeoutOrders(data);
      setError(null);
    } catch (err) {
      setError('Failed to load takeout orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = takeoutOrderService.subscribe((data) => {
      setTakeoutOrders(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createTakeoutOrder = useCallback(async (orderData: Omit<TakeoutOrder, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    const order = await takeoutOrderService.create(orderData);
    if (order) {
      return order;
    }
    throw new Error('Failed to create takeout order');
  }, []);
  
  const updateTakeoutOrder = useCallback(async (id: string, updates: Partial<TakeoutOrder>) => {
    const success = await takeoutOrderService.update(id, updates);
    if (!success) {
      throw new Error('Failed to update takeout order');
    }
  }, []);
  
  const deleteTakeoutOrder = useCallback(async (id: string) => {
    const success = await takeoutOrderService.delete(id);
    if (!success) {
      throw new Error('Failed to delete takeout order');
    }
  }, []);
  
  return {
    takeoutOrders,
    loading,
    error,
    createTakeoutOrder,
    updateTakeoutOrder,
    deleteTakeoutOrder,
    refresh: loadTakeoutOrders,
  };
}