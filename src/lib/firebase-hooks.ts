/**
 * Firebase Hooks - React hooks for real-time Firestore data
 * 
 * These hooks provide convenient access to Firebase collections with real-time updates
 */

import { useState, useEffect } from 'react';
import {
  guestService,
  tableService,
  floorService,
  messageService,
  menuItemService,
  menuCategoryService,
  reservationService,
  takeoutOrderService,
  conversationService,
  conversationMessageService,
  type Guest,
  type Table,
  type Floor,
  type Message,
  type MenuItem,
  type MenuCategory,
  type Reservation,
  type TakeoutOrder,
  type Conversation,
  type ConversationMessage,
} from './firebase-service';

// ============================================================================
// Guest Hooks
// ============================================================================

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = guestService.subscribe((data) => {
      setGuests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createGuest = async (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await guestService.create(guestData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create guest');
      return null;
    }
  };

  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    try {
      return await guestService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update guest');
      return false;
    }
  };

  const deleteGuest = async (id: string) => {
    try {
      return await guestService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete guest');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await guestService.getAll();
      setGuests(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guests');
      setLoading(false);
    }
  };

  return {
    guests,
    loading,
    error,
    createGuest,
    updateGuest,
    deleteGuest,
    refresh,
  };
}

// ============================================================================
// Table Hooks
// ============================================================================

export function useTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = tableService.subscribe((data) => {
      setTables(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await tableService.create(tableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
      return null;
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      return await tableService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update table');
      return false;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      return await tableService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await tableService.getAll();
      setTables(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
      setLoading(false);
    }
  };

  return {
    tables,
    loading,
    error,
    createTable,
    updateTable,
    deleteTable,
    refresh,
  };
}

// ============================================================================
// Floor Hooks
// ============================================================================

export function useFloors() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = floorService.subscribe((data) => {
      setFloors(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createFloor = async (floorData: Omit<Floor, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await floorService.create(floorData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create floor');
      return null;
    }
  };

  const updateFloor = async (id: string, updates: Partial<Floor>) => {
    try {
      return await floorService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update floor');
      return false;
    }
  };

  const deleteFloor = async (id: string) => {
    try {
      return await floorService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete floor');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await floorService.getAll();
      setFloors(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch floors');
      setLoading(false);
    }
  };

  return {
    floors,
    loading,
    error,
    createFloor,
    updateFloor,
    deleteFloor,
    refresh,
  };
}

// ============================================================================
// Message Hooks
// ============================================================================

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = messageService.subscribe((data) => {
      setMessages(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createMessage = async (messageData: Omit<Message, 'id' | 'restaurantId'>) => {
    try {
      return await messageService.create(messageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create message');
      return null;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await messageService.getAll();
      setMessages(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    createMessage,
    refresh,
  };
}

// ============================================================================
// Menu Item Hooks
// ============================================================================

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = menuItemService.subscribe((data) => {
      setMenuItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createMenuItem = async (itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await menuItemService.create(itemData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu item');
      return null;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      return await menuItemService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu item');
      return false;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      return await menuItemService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu item');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await menuItemService.getAll();
      setMenuItems(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items');
      setLoading(false);
    }
  };

  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refresh,
  };
}

// ============================================================================
// Menu Category Hooks
// ============================================================================

export function useMenuCategories() {
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = menuCategoryService.subscribe((data) => {
      setMenuCategories(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createMenuCategory = async (categoryData: Omit<MenuCategory, 'id' | 'createdAt' | 'restaurantId'>) => {
    try {
      return await menuCategoryService.create(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu category');
      return null;
    }
  };

  const updateMenuCategory = async (id: string, updates: Partial<MenuCategory>) => {
    try {
      return await menuCategoryService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu category');
      return false;
    }
  };

  const deleteMenuCategory = async (id: string) => {
    try {
      return await menuCategoryService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu category');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await menuCategoryService.getAll();
      setMenuCategories(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menu categories');
      setLoading(false);
    }
  };

  return {
    menuCategories,
    loading,
    error,
    createMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    refresh,
  };
}

// ============================================================================
// Reservation Hooks
// ============================================================================

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = reservationService.subscribe((data) => {
      setReservations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await reservationService.create(reservationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reservation');
      return null;
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      return await reservationService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reservation');
      return false;
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      return await reservationService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reservation');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getAll();
      setReservations(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reservations');
      setLoading(false);
    }
  };

  return {
    reservations,
    loading,
    error,
    createReservation,
    updateReservation,
    deleteReservation,
    refresh,
  };
}

// ============================================================================
// Takeout Order Hooks
// ============================================================================

export function useTakeoutOrders() {
  const [takeoutOrders, setTakeoutOrders] = useState<TakeoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = takeoutOrderService.subscribe((data) => {
      setTakeoutOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createTakeoutOrder = async (orderData: Omit<TakeoutOrder, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await takeoutOrderService.create(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create takeout order');
      return null;
    }
  };

  const updateTakeoutOrder = async (id: string, updates: Partial<TakeoutOrder>) => {
    try {
      return await takeoutOrderService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update takeout order');
      return false;
    }
  };

  const deleteTakeoutOrder = async (id: string) => {
    try {
      return await takeoutOrderService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete takeout order');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await takeoutOrderService.getAll();
      setTakeoutOrders(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch takeout orders');
      setLoading(false);
    }
  };

  return {
    takeoutOrders,
    loading,
    error,
    createTakeoutOrder,
    updateTakeoutOrder,
    deleteTakeoutOrder,
    refresh,
  };
}

// ============================================================================
// Conversation Hooks
// ============================================================================

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = conversationService.subscribe((data) => {
      setConversations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createConversation = async (conversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => {
    try {
      return await conversationService.create(conversationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    try {
      return await conversationService.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation');
      return false;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      return await conversationService.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      return false;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await conversationService.getAll();
      setConversations(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      setLoading(false);
    }
  };

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    refresh,
  };
}

// ============================================================================
// Conversation Messages Hook (Subcollection)
// ============================================================================

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const unsubscribe = conversationMessageService.subscribeToConversation(conversationId, (data) => {
      setMessages(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const createMessage = async (messageData: Omit<ConversationMessage, 'id'>) => {
    if (!conversationId) {
      setError('No conversation selected');
      return null;
    }

    try {
      return await conversationMessageService.create(conversationId, messageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create message');
      return null;
    }
  };

  const updateMessage = async (messageId: string, updates: Partial<ConversationMessage>) => {
    if (!conversationId) {
      setError('No conversation selected');
      return false;
    }

    try {
      return await conversationMessageService.update(conversationId, messageId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!conversationId) {
      setError('No conversation selected');
      return false;
    }

    try {
      return await conversationMessageService.delete(conversationId, messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  };

  const refresh = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const data = await conversationMessageService.getAllForConversation(conversationId);
      setMessages(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    refresh,
  };
}
