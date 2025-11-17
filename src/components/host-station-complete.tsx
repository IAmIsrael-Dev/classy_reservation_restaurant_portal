import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import type { DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useGuests, useTables, useMessages, useFloors } from '../lib/firebase-hooks';
import {
  LayoutDashboard,
  List,
  LayoutGrid,
  MessageSquare,
  Settings,
  Filter,
  Users,
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Send,
  X,
  Trash2,
  Check,
  TrendingUp,
  User,
  Grid3x3,
  CircleDot,
  CheckCircle2,
  Utensils,
  Timer,
  AlertCircle,
  ChevronRight,
  Search,
} from 'lucide-react';

// Types
interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  partySize: number;
  status: 'waiting' | 'reserved' | 'seated' | 'completed';
  tableNumber?: number;
  arrivalTime?: string;
  reservationTime?: string;
  seatedTime?: string;
  specialRequests?: string;
  source: 'walk-in' | 'phone' | 'online' | 'app';
  waitTime?: number;
  notified?: boolean;
}

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  section: string;
  position: { x: number; y: number };
  currentGuest?: string;
  shape: 'round' | 'square' | 'rectangle';
  floor: 'ground' | 'main' | 'upper' | 'rooftop';
}

interface Message {
  id: string;
  guestId: string;
  guestName: string;
  phone: string;
  message: string;
  timestamp: string;
  sent: boolean;
  template?: string;
}

// Mock Data Generators
const generateMockGuests = (): Guest[] => {
  const names = ['Sarah Johnson', 'Michael Chen', 'Emma Williams', 'David Brown', 'Lisa Garcia', 'James Martinez', 'Olivia Taylor', 'Daniel Anderson', 'Sophia Lee', 'Matthew White', 'Isabella Harris', 'Christopher Clark', 'Ava Lewis', 'Ryan Walker', 'Mia Robinson'];
  const sources: ('walk-in' | 'phone' | 'online' | 'app')[] = ['walk-in', 'phone', 'online', 'app'];
  
  const guests: Guest[] = [];
  
  // Waitlist
  for (let i = 0; i < 8; i++) {
    guests.push({
      id: `wait-${i}`,
      name: names[i % names.length],
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
      partySize: Math.floor(Math.random() * 6) + 2,
      status: 'waiting',
      arrivalTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      waitTime: Math.floor(Math.random() * 60) + 10,
      specialRequests: i % 3 === 0 ? 'High chair needed' : undefined,
    });
  }
  
  // Reservations
  for (let i = 8; i < 20; i++) {
    const resTime = new Date(Date.now() + Math.random() * 7200000);
    guests.push({
      id: `res-${i}`,
      name: names[i % names.length],
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
      partySize: Math.floor(Math.random() * 8) + 2,
      status: 'reserved',
      reservationTime: resTime.toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      specialRequests: i % 4 === 0 ? 'Birthday celebration' : undefined,
    });
  }
  
  // Seated
  for (let i = 20; i < 30; i++) {
    guests.push({
      id: `seated-${i}`,
      name: names[i % names.length],
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
      partySize: Math.floor(Math.random() * 6) + 2,
      status: 'seated',
      tableNumber: Math.floor(Math.random() * 30) + 1,
      seatedTime: new Date(Date.now() - Math.random() * 5400000).toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }
  
  return guests;
};

const generateMockTables = (): Table[] => {
  const tables: Table[] = [];
  const sections = ['Main Dining', 'Patio', 'Bar', 'Private'];
  const shapes: ('round' | 'square' | 'rectangle')[] = ['round', 'square', 'rectangle'];
  const statuses: ('available' | 'occupied' | 'reserved' | 'cleaning')[] = ['available', 'occupied', 'reserved', 'cleaning'];
  const floors: ('ground' | 'main' | 'upper' | 'rooftop')[] = ['ground', 'main', 'upper', 'rooftop'];
  
  // Create tables across different floors - 40 total tables (10 per floor)
  let tableId = 1;
  for (let floorIndex = 0; floorIndex < floors.length; floorIndex++) {
    // Create 10 tables per floor in a centered grid layout
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      tables.push({
        id: tableId,
        number: tableId,
        capacity: tableId % 7 === 0 ? 8 : tableId % 5 === 0 ? 6 : tableId % 3 === 0 ? 4 : 2,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        section: sections[Math.floor(Math.random() * sections.length)],
        shape: shapes[i % 3],
        floor: floors[floorIndex],
        position: {
          x: col * 140 + 50,
          y: row * 140 + 50,
        },
      });
      tableId++;
    }
  }
  
  return tables;
};

// Utility Functions

// Draggable Guest Card Component
interface DraggableGuestCardProps {
  guest: Guest;
  onClick: () => void;
}

function DraggableGuestCard({ guest, onClick }: DraggableGuestCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GUEST',
    item: { id: guest.id, guest },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getStatusColor = (status: Guest['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reserved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'seated': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSourceIcon = (source: Guest['source']) => {
    switch (source) {
      case 'walk-in': return '🚶';
      case 'phone': return '📞';
      case 'online': return '💻';
      case 'app': return '📱';
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <motion.div
      ref={(node: HTMLDivElement | null) => { drag(node); }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="p-4 bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-slate-100">{guest.name}</h4>
              <span className="text-lg">{getSourceIcon(guest.source)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="w-3 h-3" />
              <span>{guest.partySize} guests</span>
            </div>
          </div>
          {guest.tableNumber && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className={getStatusColor(guest.status)}>
                    Table {guest.tableNumber}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Currently at Table {guest.tableNumber}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="space-y-1 text-xs text-slate-400">
          {guest.waitTime && (
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>Wait: {guest.waitTime} min</span>
            </div>
          )}
          {guest.reservationTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(guest.reservationTime)}</span>
            </div>
          )}
          {guest.specialRequests && (
            <div className="flex items-center gap-1 text-yellow-400">
              <AlertCircle className="w-3 h-3" />
              <span>{guest.specialRequests}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// Droppable Table Component for Floor Plan
interface DroppableTableProps {
  table: Table;
  currentGuest?: Guest;
  onDrop: (guestId: string, tableId: number) => void;
  onClick: () => void;
}

function DroppableTable({ table, currentGuest, onDrop, onClick }: DroppableTableProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'GUEST',
    drop: (item: { id: string; guest: Guest }) => {
      if (table.status === 'available') {
        onDrop(item.id, table.number);
      }
    },
    canDrop: () => table.status === 'available',
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  // Professional color system aligned with OpenTable/Toast
  const statusStyles = {
    available: {
      bg: 'bg-slate-700/80',
      border: 'border-slate-600/60',
      shadow: 'shadow-lg shadow-slate-900/40',
      hoverBg: 'hover:bg-slate-700/90',
      text: 'text-slate-100',
      indicator: 'bg-emerald-400',
      indicatorRing: 'ring-emerald-400/30',
    },
    reserved: {
      bg: 'bg-gradient-to-br from-amber-500/90 to-amber-600/90',
      border: 'border-amber-400/40',
      shadow: 'shadow-lg shadow-amber-900/30',
      hoverBg: 'hover:from-amber-500 hover:to-amber-600',
      text: 'text-white',
      indicator: 'bg-amber-200',
      indicatorRing: 'ring-amber-300/40',
    },
    occupied: {
      bg: 'bg-gradient-to-br from-rose-600/85 to-rose-700/85',
      border: 'border-rose-500/30',
      shadow: 'shadow-lg shadow-rose-900/30',
      hoverBg: 'hover:from-rose-600 hover:to-rose-700',
      text: 'text-white',
      indicator: 'bg-rose-300',
      indicatorRing: 'ring-rose-400/30',
    },
    cleaning: {
      bg: 'bg-gradient-to-br from-indigo-500/75 to-indigo-600/75',
      border: 'border-indigo-400/30',
      shadow: 'shadow-lg shadow-indigo-900/30',
      hoverBg: 'hover:from-indigo-500/90 hover:to-indigo-600/90',
      text: 'text-white',
      indicator: 'bg-indigo-300',
      indicatorRing: 'ring-indigo-400/40',
    },
  };

  const shapeClasses = {
    round: 'rounded-full',
    square: 'rounded-2xl',
    rectangle: 'rounded-2xl',
  };

  const currentStyle = statusStyles[table.status];
  const isDropTarget = isOver && canDrop;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            ref={(node: HTMLButtonElement | null) => { drop(node); }}
            whileHover={{ 
              scale: table.status === 'available' ? 1.08 : 1.03,
              y: -2
            }}
            whileTap={{ scale: 0.96 }}
            className={`absolute ${shapeClasses[table.shape]} ${currentStyle.bg} ${currentStyle.border} ${currentStyle.shadow} ${currentStyle.hoverBg} ${currentStyle.text} border-2 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden ${
              isDropTarget ? 'ring-4 ring-blue-400/60 scale-110 shadow-2xl' : ''
            }`}
            style={{
              left: `${table.position.x}px`,
              top: `${table.position.y}px`,
              width: table.shape === 'rectangle' ? '120px' : '90px',
              height: '90px',
            }}
            onClick={onClick}
          >
            {/* 3D depth effect - top highlight */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent rounded-[inherit]" />
            
            {/* Shimmer effect for cleaning status */}
            {table.status === 'cleaning' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
            
            {/* Table content container */}
            <div className="relative z-10 flex flex-col items-center justify-center px-2">
              {/* Table number label */}
              <div className="text-lg font-semibold tracking-tight drop-shadow-sm">
                T{table.number}
              </div>
              
              {/* Capacity badge */}
              <div className="mt-0.5 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm flex items-center gap-1">
                <Users className="w-3 h-3 opacity-80" />
                <span className="text-[10px] font-medium">{table.capacity}</span>
              </div>
              
              {/* Guest name if occupied/reserved */}
              {currentGuest && (
                <div className="mt-1.5 text-[9px] font-medium truncate max-w-full px-2 py-0.5 bg-black/25 rounded-md backdrop-blur-sm">
                  {currentGuest.name.split(' ')[0]}
                </div>
              )}
            </div>
            
            {/* Status indicator ring (top-right corner) */}
            <motion.div 
              className={`absolute top-1.5 right-1.5 w-3 h-3 rounded-full ${currentStyle.indicator} ring-2 ${currentStyle.indicatorRing} shadow-sm`}
              animate={table.status === 'reserved' ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Drop target indicator */}
            {isDropTarget && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute -top-3 -right-3 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-400/40"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
            
            {/* Bottom shadow for depth */}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/15 to-transparent rounded-[inherit]" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-700 border-slate-600">
          <div className="text-sm">
            <p className="font-semibold">Table {table.number}</p>
            <p>Capacity: {table.capacity} guests</p>
            <p>Section: {table.section}</p>
            <p>Status: {table.status}</p>
            {currentGuest && (
              <>
                <Separator className="my-2 bg-slate-600" />
                <p className="font-semibold">{currentGuest.name}</p>
                <p>Party of {currentGuest.partySize}</p>
                {currentGuest.seatedTime && (
                  <p className="text-xs text-slate-400">
                    Seated: {new Date(currentGuest.seatedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Droppable Section Component
interface DroppableSectionProps {
  status: Guest['status'];
  title: string;
  icon: React.ReactNode;
  guests: Guest[];
  onDrop: (guestId: string, newStatus: Guest['status']) => void;
  onGuestClick: (guest: Guest) => void;
}

function DroppableSection({ status, title, icon, guests, onDrop, onGuestClick }: DroppableSectionProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'GUEST',
    drop: (item: { id: string; guest: Guest }) => {
      onDrop(item.id, status);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={(node: HTMLDivElement | null) => { drop(node); }} className="flex-1 min-w-0">
      <div className={`h-full rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-900/50'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-lg text-slate-100">{title}</h3>
            </div>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {guests.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3 pr-4">
              {guests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>No guests</p>
                </div>
              ) : (
                guests.map((guest) => (
                  <DraggableGuestCard
                    key={guest.id}
                    guest={guest}
                    onClick={() => onGuestClick(guest)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function HostStationComplete({ isDemo = false }: { isDemo?: boolean }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [previewGuest, setPreviewGuest] = useState<Guest | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [guestToRemove, setGuestToRemove] = useState<Guest | null>(null);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [messagingGuest, setMessagingGuest] = useState<Guest | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Bella Vista',
    phone: '(555) 123-4567',
    email: 'info@bellavista.com',
    address: '123 Main Street, Downtown',
    hours: 'Mon-Sun: 5:00 PM - 11:00 PM',
  });
  
  // Floor Plan State
  const [selectedFloor, setSelectedFloor] = useState<'ground' | 'main' | 'upper' | 'rooftop'>('main');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSeatConfirm, setShowSeatConfirm] = useState(false);
  const [guestToSeat, setGuestToSeat] = useState<Guest | null>(null);
  const [tableToSeat, setTableToSeat] = useState<Table | null>(null);

  // Firebase integration
  const firebaseGuests = useGuests();
  const firebaseTables = useTables();
  const firebaseMessages = useMessages();
  const firebaseFloors = useFloors();

  // Helper function to convert Firebase Guest to component Guest type
  const convertFirebaseGuest = (fbGuest: typeof firebaseGuests.guests[0]): Guest => {
    // Map Firebase status to component status
    const statusMap: Record<string, Guest['status']> = {
      'waiting': 'waiting',
      'confirmed': 'reserved',
      'seated': 'seated',
      'completed': 'completed',
      'cancelled': 'waiting',
      'no-show': 'waiting',
    };

    return {
      id: fbGuest.id,
      name: fbGuest.name,
      phone: fbGuest.phone,
      email: fbGuest.email || '',
      partySize: fbGuest.partySize,
      status: statusMap[fbGuest.status] || 'waiting',
      tableNumber: fbGuest.tableNumber,
      arrivalTime: fbGuest.createdAt,
      reservationTime: fbGuest.reservationTime,
      specialRequests: fbGuest.specialRequests,
      source: fbGuest.source,
      waitTime: fbGuest.waitTime,
      notified: fbGuest.notified,
    };
  };

  // Helper function to convert Firebase Table to component Table type
  const convertFirebaseTable = (fbTable: import('../lib/firebase-service').Table, floorName: string): Table => {
    // Map floor name to expected floor type
    const floorMap: Record<string, Table['floor']> = {
      'Ground Floor': 'ground',
      'Main Floor': 'main',
      'Upper Floor': 'upper',
      'Rooftop': 'rooftop',
      'main': 'main',
      'ground': 'ground',
      'upper': 'upper',
      'rooftop': 'rooftop',
    };
    
    const mappedFloor = floorMap[floorName] || 'main';
    
    return {
      id: parseInt(fbTable.id.replace(/\D/g, ''), 10) || Math.floor(Math.random() * 1000),
      number: fbTable.number,
      capacity: fbTable.capacity,
      status: fbTable.status,
      section: fbTable.section,
      position: fbTable.position,
      currentGuest: fbTable.currentGuest,
      shape: fbTable.shape as Table['shape'],
      floor: mappedFloor,
    };
  };

  // Load data from Firebase or use mock data in demo mode
  useEffect(() => {
    if (isDemo) {
      // Demo mode - use mock data
      setGuests(generateMockGuests());
    } else if (!firebaseGuests.loading) {
      // Realtime mode - use Firebase data (empty array if no data)
      if (firebaseGuests.guests.length > 0) {
        const convertedGuests = firebaseGuests.guests.map(convertFirebaseGuest);
        setGuests(convertedGuests);
      } else {
        setGuests([]);
      }
    }
  }, [firebaseGuests.guests, firebaseGuests.loading, isDemo]);

  useEffect(() => {
    if (isDemo) {
      // Demo mode - use mock data
      setTables(generateMockTables());
    } else if (!firebaseFloors.loading) {
      // Realtime mode - extract tables from floors
      if (firebaseFloors.floors.length > 0) {
        // Flatten all tables from all floors
        const allTables: Table[] = [];
        firebaseFloors.floors.forEach(floor => {
          if (floor.layout && floor.layout.length > 0) {
            floor.layout.forEach(fbTable => {
              allTables.push(convertFirebaseTable(fbTable, floor.name));
            });
          }
        });
        setTables(allTables);
      } else {
        setTables([]);
      }
    }
  }, [firebaseFloors.floors, firebaseFloors.loading, isDemo]);

  useEffect(() => {
    if (isDemo) {
      // Demo mode - no messages
      setMessages([]);
    } else if (!firebaseMessages.loading) {
      // Realtime mode - use Firebase data (empty array if no data)
      setMessages(firebaseMessages.messages);
    }
  }, [firebaseMessages.messages, firebaseMessages.loading, isDemo]);

  const handleDrop = (guestId: string, newStatus: Guest['status']) => {
    setGuests(guests.map(g => {
      if (g.id === guestId) {
        const updatedGuest = { ...g, status: newStatus };
        
        if (newStatus === 'seated') {
          setShowTableModal(true);
          setSelectedGuest(updatedGuest);
        }
        
        toast.success(`${g.name} moved to ${newStatus}`);
        return updatedGuest;
      }
      return g;
    }));
  };

  const handleAssignTable = (tableNumber: number) => {
    if (selectedGuest) {
      setGuests(guests.map(g => 
        g.id === selectedGuest.id 
          ? { ...g, tableNumber, seatedTime: new Date().toISOString() }
          : g
      ));
      setTables(tables.map(t => 
        t.number === tableNumber
          ? { ...t, status: 'occupied', currentGuest: selectedGuest.id }
          : t
      ));
      toast.success(`Table ${tableNumber} assigned to ${selectedGuest.name}`);
      setShowTableModal(false);
      setSelectedGuest(null);
    }
  };

  const handleOpenMessagePreview = (guestId: string, customMessage?: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const templates = {
      tableReady: `Hi ${guest.name}, your table is ready! Please come to the host stand. - ${restaurantInfo.name}`,
      running15: `Hi ${guest.name}, we're running about 15 minutes behind. Thank you for your patience! - ${restaurantInfo.name}`,
      running30: `Hi ${guest.name}, we're running about 30 minutes behind. Thank you for your patience! - ${restaurantInfo.name}`,
      confirmation: `Hi ${guest.name}, confirming your reservation for ${guest.partySize} at ${guest.reservationTime ? new Date(guest.reservationTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'today'}. - ${restaurantInfo.name}`,
    };

    setPreviewGuest(guest);
    setPreviewMessage(customMessage || templates.tableReady);
    setShowMessagePreview(true);
  };

  const handleSendMessage = async () => {
    if (!previewGuest) return;

    // Use Firebase to send message
    await handleFirebaseSendMessage(previewGuest, previewMessage);

    // Update guest notification status
    await handleFirebaseUpdateGuest(previewGuest.id, { notified: true });

    setShowMessagePreview(false);
    setPreviewGuest(null);
    setPreviewMessage('');
  };

  const handleRemoveFromQueue = (guest: Guest) => {
    setGuestToRemove(guest);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveFromQueue = async () => {
    if (!guestToRemove) return;
    
    // Use Firebase to delete guest
    await handleFirebaseDeleteGuest(guestToRemove.id);
    
    setShowRemoveConfirm(false);
    setGuestToRemove(null);
  };

  const handleTableDrop = (guestId: string, tableNumber: number) => {
    const guest = guests.find(g => g.id === guestId);
    const table = tables.find(t => t.number === tableNumber);
    
    if (guest && table && table.status === 'available') {
      setGuestToSeat(guest);
      setTableToSeat(table);
      setShowSeatConfirm(true);
    }
  };

  const confirmSeatGuest = async () => {
    if (!guestToSeat || !tableToSeat) return;

    // Use Firebase to seat guest - convert table ID to string for Firebase
    await handleFirebaseSeatGuest(guestToSeat.id, tableToSeat.id.toString(), tableToSeat.number);
    
    setShowSeatConfirm(false);
    setGuestToSeat(null);
    setTableToSeat(null);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setShowTableDetails(true);
  };

  const handleRefreshFloorPlan = () => {
    toast.success('Floor plan refreshed');
  };

  // Firebase: Update guest status
  const handleFirebaseUpdateGuest = async (guestId: string, updates: Partial<typeof firebaseGuests.guests[0]>) => {
    try {
      await firebaseGuests.updateGuest(guestId, updates);
      toast.success('Guest updated');
    } catch (error) {
      console.error('Failed to update guest:', error);
      toast.error('Failed to update guest');
    }
  };

  // Firebase: Seat guest at table
  const handleFirebaseSeatGuest = async (guestId: string, tableId: string, tableNumber: number) => {
    try {
      // Update guest
      await firebaseGuests.updateGuest(guestId, {
        status: 'seated',
        tableNumber: tableNumber,
      });
      
      // Update table
      await firebaseTables.updateTable(tableId, {
        status: 'occupied',
        currentGuest: guestId,
      });
      
      toast.success('Guest seated successfully');
    } catch (error) {
      console.error('Failed to seat guest:', error);
      toast.error('Failed to seat guest');
    }
  };

  // Firebase: Send message to guest
  const handleFirebaseSendMessage = async (guest: Guest, message: string) => {
    try {
      await firebaseMessages.sendMessage({
        guestId: guest.id,
        guestName: guest.name,
        phone: guest.phone,
        message: message,
        timestamp: new Date().toISOString(),
        sent: true,
        template: selectedTemplate || undefined,
      });
      
      setMessageText('');
      setSelectedTemplate('');
      toast.success('Message sent to ' + guest.name);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  // Firebase: Delete guest
  const handleFirebaseDeleteGuest = async (guestId: string) => {
    try {
      await firebaseGuests.deleteGuest(guestId);
      toast.success('Guest removed');
    } catch (error) {
      console.error('Failed to remove guest:', error);
      toast.error('Failed to remove guest');
    }
  };

  const waitlistGuests = guests.filter(g => g.status === 'waiting');
  const reservedGuests = guests.filter(g => g.status === 'reserved');
  
  // Floor Plan Filtering
  const floorTables = tables.filter(t => t.floor === selectedFloor);
  const filteredFloorTables = floorTables.filter(t => {
    const matchesSearch = tableSearchQuery === '' || 
                         t.number.toString().includes(tableSearchQuery) ||
                         t.section.toLowerCase().includes(tableSearchQuery.toLowerCase());
    const matchesAvailable = !showOnlyAvailable || t.status === 'available';
    return matchesSearch && matchesAvailable;
  });
  const seatedGuests = guests.filter(g => g.status === 'seated');

  const stats = {
    totalGuests: guests.length,
    waitlist: waitlistGuests.length,
    reservations: reservedGuests.length,
    seated: seatedGuests.length,
    availableTables: tables.filter(t => t.status === 'available').length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    avgWaitTime: waitlistGuests.length > 0 
      ? Math.round(waitlistGuests.reduce((acc, g) => acc + (g.waitTime || 0), 0) / waitlistGuests.length)
      : 0,
  };



  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-900">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-[1400px]">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl text-slate-100 mb-1">Host Station</h1>
            <p className="text-sm text-slate-400">Manage reservations, waitlist, and table assignments</p>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800 p-1 mb-4 md:mb-6">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700 text-xs md:text-sm">
                <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-slate-700 text-xs md:text-sm">
                <List className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">List View</span>
              </TabsTrigger>
              <TabsTrigger value="floor" className="data-[state=active]:bg-slate-700 text-xs md:text-sm">
                <LayoutGrid className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Floor Plan</span>
              </TabsTrigger>
              <TabsTrigger value="messaging" className="data-[state=active]:bg-slate-700 text-xs md:text-sm">
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Messaging</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700 text-xs md:text-sm">
                <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="p-3 md:p-6 bg-slate-800 border-slate-700">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  </div>
                  <div className="text-2xl md:text-3xl text-slate-100 mb-0.5 md:mb-1">{stats.totalGuests}</div>
                  <div className="text-xs md:text-sm text-slate-400">Total Guests</div>
                </Card>

                <Card className="p-3 md:p-6 bg-slate-800 border-slate-700">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
                      {stats.waitlist}
                    </Badge>
                  </div>
                  <div className="text-2xl md:text-3xl text-slate-100 mb-0.5 md:mb-1">{stats.avgWaitTime} min</div>
                  <div className="text-xs md:text-sm text-slate-400">Avg Wait Time</div>
                </Card>

                <Card className="p-3 md:p-6 bg-slate-800 border-slate-700">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                      {stats.reservations}
                    </Badge>
                  </div>
                  <div className="text-2xl md:text-3xl text-slate-100 mb-0.5 md:mb-1">{stats.reservations}</div>
                  <div className="text-xs md:text-sm text-slate-400">Reservations</div>
                </Card>

                <Card className="p-3 md:p-6 bg-slate-800 border-slate-700">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <Grid3x3 className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                    <span className="text-xs md:text-sm text-slate-400">
                      {stats.occupiedTables}/{tables.length}
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl text-slate-100 mb-0.5 md:mb-1">{stats.availableTables}</div>
                  <div className="text-xs md:text-sm text-slate-400">Tables Available</div>
                </Card>
              </div>

              {/* Upcoming Reservations */}
              <Card className="p-6 bg-slate-800 border-slate-700">
                <h3 className="text-xl text-slate-100 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Upcoming Reservations
                </h3>
                <div className="space-y-3">
                  {reservedGuests.slice(0, 5).map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                      onClick={() => setSelectedGuest(guest)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-slate-100">{guest.name}</div>
                          <div className="text-sm text-slate-400">
                            {guest.partySize} guests • {guest.reservationTime && new Date(guest.reservationTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Current Waitlist */}
              <Card className="p-6 bg-slate-800 border-slate-700">
                <h3 className="text-xl text-slate-100 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Current Waitlist
                </h3>
                <div className="space-y-3">
                  {waitlistGuests.slice(0, 5).map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                      onClick={() => setSelectedGuest(guest)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-slate-100">{guest.name}</div>
                          <div className="text-sm text-slate-400">
                            {guest.partySize} guests • Waiting {guest.waitTime} min
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMessagePreview(guest.id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Notify
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* List View Tab */}
            <TabsContent value="list" className="space-y-6">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Search guests by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-100">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="waiting">Waitlist</SelectItem>
                    <SelectItem value="reserved">Reservations</SelectItem>
                    <SelectItem value="seated">Seated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Drag and Drop Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DroppableSection
                  status="waiting"
                  title="Waitlist"
                  icon={<Clock className="w-5 h-5 text-yellow-400" />}
                  guests={waitlistGuests}
                  onDrop={handleDrop}
                  onGuestClick={setSelectedGuest}
                />
                <DroppableSection
                  status="reserved"
                  title="Reservations"
                  icon={<Calendar className="w-5 h-5 text-blue-400" />}
                  guests={reservedGuests}
                  onDrop={handleDrop}
                  onGuestClick={setSelectedGuest}
                />
                <DroppableSection
                  status="seated"
                  title="Seated"
                  icon={<Utensils className="w-5 h-5 text-green-400" />}
                  guests={seatedGuests}
                  onDrop={handleDrop}
                  onGuestClick={setSelectedGuest}
                />
              </div>
            </TabsContent>

            {/* Floor Plan Tab */}
            <TabsContent value="floor" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Left Sidebar - Waitlist & Reservations (Draggable) */}
                <div className="md:col-span-1 space-y-4">
                  {/* Waitlist Section */}
                  <Card className="p-3 bg-slate-800 border-slate-700">
                    <h3 className="text-sm text-slate-100 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      Waitlist
                      <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 text-xs">
                        {waitlistGuests.length}
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-400 mb-3 italic">
                      Drag guests to tables to seat them
                    </p>
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2 pr-2">
                        {waitlistGuests.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">No guests waiting</p>
                        ) : (
                          waitlistGuests.map((guest) => (
                            <DraggableGuestCard
                              key={guest.id}
                              guest={guest}
                              onClick={() => setSelectedGuest(guest)}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </Card>

                  {/* Reservations Section */}
                  <Card className="p-3 bg-slate-800 border-slate-700">
                    <h3 className="text-sm text-slate-100 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Reservations
                      <Badge className="ml-auto bg-blue-500/20 text-blue-400 text-xs">
                        {reservedGuests.length}
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-400 mb-3 italic">
                      Upcoming reserved tables
                    </p>
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2 pr-2">
                        {reservedGuests.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">No reservations</p>
                        ) : (
                          reservedGuests.map((guest) => (
                            <DraggableGuestCard
                              key={guest.id}
                              guest={guest}
                              onClick={() => setSelectedGuest(guest)}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                {/* Right Area - Floor Plan */}
                <div className="md:col-span-3">
                  <Card className="p-4 bg-slate-800 border-slate-700">
                    {/* Header with Floor Selector */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg text-slate-100 flex items-center gap-2">
                          <LayoutGrid className="w-5 h-5 text-blue-400" />
                          Floor Plan
                        </h3>
                        <Select value={selectedFloor} onValueChange={(value) => setSelectedFloor(value as 'ground' | 'main' | 'upper' | 'rooftop')}>
                          <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ground">Ground Floor</SelectItem>
                            <SelectItem value="main">Main Floor</SelectItem>
                            <SelectItem value="upper">Upper Floor</SelectItem>
                            <SelectItem value="rooftop">Rooftop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRefreshFloorPlan}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <CircleDot className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      {/* Search */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          placeholder="Search table by number or section..."
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                      
                      {/* Filter Toggle */}
                      <Button
                        size="sm"
                        variant={showOnlyAvailable ? 'default' : 'outline'}
                        onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                        className={showOnlyAvailable ? 'bg-green-600 hover:bg-green-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Available Only
                      </Button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 flex-wrap text-xs mb-4 pb-3 border-b border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-lg bg-slate-700/80 border border-slate-600/60 shadow-sm"></div>
                        <span className="text-slate-400">Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-amber-500/90 to-amber-600/90 border border-amber-400/40 shadow-sm"></div>
                        <span className="text-slate-400">Reserved</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-rose-600/85 to-rose-700/85 border border-rose-500/30 shadow-sm"></div>
                        <span className="text-slate-400">Occupied</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-indigo-500/75 to-indigo-600/75 border border-indigo-400/30 shadow-sm"></div>
                        <span className="text-slate-400">Cleaning</span>
                      </div>
                    </div>

                    {/* Floor Plan Canvas */}
                    <div className="relative bg-slate-900 rounded-lg p-6 h-[500px] border-2 border-slate-700 overflow-auto">
                      <div className="relative w-[800px] h-[400px] mx-auto">
                        {filteredFloorTables.map((table) => {
                          const currentGuest = guests.find(g => g.tableNumber === table.number);
                          
                          return (
                            <DroppableTable
                              key={table.id}
                              table={table}
                              currentGuest={currentGuest}
                              onDrop={handleTableDrop}
                              onClick={() => handleTableClick(table)}
                            />
                          );
                        })}
                        
                        {filteredFloorTables.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-slate-500">No tables found matching your criteria</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Table Stats for Current Floor */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      <div className="p-2 bg-slate-700/30 rounded-lg border border-slate-600/40 backdrop-blur-sm">
                        <div className="text-[10px] text-slate-300 mb-0.5">Available</div>
                        <div className="text-lg text-slate-100">
                          {floorTables.filter((t) => t.status === 'available').length}
                        </div>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30 backdrop-blur-sm">
                        <div className="text-[10px] text-amber-400 mb-0.5">Reserved</div>
                        <div className="text-lg text-amber-400">
                          {floorTables.filter((t) => t.status === 'reserved').length}
                        </div>
                      </div>
                      <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/30 backdrop-blur-sm">
                        <div className="text-[10px] text-rose-400 mb-0.5">Occupied</div>
                        <div className="text-lg text-rose-400">
                          {floorTables.filter((t) => t.status === 'occupied').length}
                        </div>
                      </div>
                      <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 backdrop-blur-sm">
                        <div className="text-[10px] text-indigo-400 mb-0.5">Cleaning</div>
                        <div className="text-lg text-indigo-400">
                          {floorTables.filter((t) => t.status === 'cleaning').length}
                        </div>
                      </div>
                    </div>

                    {/* Help Text */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                    >
                      <p className="text-xs text-blue-400">
                        💡 <strong>Tip:</strong> Drag a guest from the waitlist onto an available table to seat them. Click on any table to view details.
                      </p>
                    </motion.div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Messaging Tab */}
            <TabsContent value="messaging" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Send New Message */}
                <Card className="p-6 bg-slate-800 border-slate-700">
                  <h3 className="text-xl text-slate-100 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-400" />
                    Send Message
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Select Guest</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                        onClick={() => setShowGuestSelector(true)}
                      >
                        <span>
                          {messagingGuest 
                            ? `${messagingGuest.name} - ${messagingGuest.partySize} guests` 
                            : 'Choose a guest...'}
                        </span>
                        <User className="w-4 h-4 ml-2 text-slate-400" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Message Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tableReady">Table Ready</SelectItem>
                          <SelectItem value="running15">Running 15 min late</SelectItem>
                          <SelectItem value="running30">Running 30 min late</SelectItem>
                          <SelectItem value="confirmation">Confirmation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Custom Message</Label>
                      <Textarea
                        placeholder="Or type a custom message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100 min-h-32"
                      />
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!messagingGuest}
                      onClick={() => {
                        if (messagingGuest) {
                          handleOpenMessagePreview(messagingGuest.id, messageText || undefined);
                        }
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </Card>

                {/* Message History */}
                <Card className="p-6 bg-slate-800 border-slate-700">
                  <h3 className="text-xl text-slate-100 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Message History
                  </h3>

                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No messages sent yet</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 hover:border-blue-500 transition-all"
                            onClick={() => {
                              // Find the guest from the message
                              const guest = guests.find(g => g.id === msg.guestId);
                              if (guest) {
                                setMessagingGuest(guest);
                                setMessageText(msg.message);
                                // Scroll to the message form
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-slate-100">{msg.guestName}</div>
                                <div className="text-sm text-slate-400">{msg.phone}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-slate-400">
                                  {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-300">{msg.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              {/* Quick Actions for Waitlist */}
              <Card className="p-6 bg-slate-800 border-slate-700">
                <h3 className="text-xl text-slate-100 mb-4">Quick Notify - Waitlist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {waitlistGuests.slice(0, 6).map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="text-slate-100 text-sm">{guest.name}</div>
                        <div className="text-xs text-slate-400">
                          {guest.partySize} guests • {guest.waitTime}m
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={guest.notified ? 'secondary' : 'default'}
                          onClick={() => handleOpenMessagePreview(guest.id)}
                          className={guest.notified ? '' : 'bg-blue-600 hover:bg-blue-700'}
                        >
                          {guest.notified ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 mr-1" />
                              Notify
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFromQueue(guest)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6 bg-slate-800 border-slate-700">
                <h3 className="text-xl text-slate-100 mb-6">Restaurant Information</h3>
                
                <div className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Restaurant Name</Label>
                    <Input
                      value={restaurantInfo.name}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={restaurantInfo.phone}
                          onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                          className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={restaurantInfo.email}
                          onChange={(e) => setRestaurantInfo({ ...restaurantInfo, email: e.target.value })}
                          className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        value={restaurantInfo.address}
                        onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                        className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Hours of Operation</Label>
                    <Input
                      value={restaurantInfo.hours}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, hours: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>

                  <Separator className="bg-slate-700" />

                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Check className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-slate-800 border-slate-700">
                <h3 className="text-xl text-slate-100 mb-6">Table Configuration</h3>
                <p className="text-slate-400 mb-4">
                  Manage your restaurant's table layout and capacity. Currently managing {tables.length} tables.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                    <div className="text-2xl text-slate-100 mb-1">{tables.filter(t => t.capacity === 2).length}</div>
                    <div className="text-sm text-slate-400">2-Top Tables</div>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                    <div className="text-2xl text-slate-100 mb-1">{tables.filter(t => t.capacity === 4).length}</div>
                    <div className="text-sm text-slate-400">4-Top Tables</div>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                    <div className="text-2xl text-slate-100 mb-1">{tables.filter(t => t.capacity === 6).length}</div>
                    <div className="text-sm text-slate-400">6-Top Tables</div>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                    <div className="text-2xl text-slate-100 mb-1">{tables.filter(t => t.capacity === 8).length}</div>
                    <div className="text-sm text-slate-400">8-Top Tables</div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Guest Detail Panel */}
        <AnimatePresence>
          {selectedGuest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedGuest(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl"
              >
                <Card className="p-6 bg-slate-800 border-slate-700">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl text-slate-100 mb-2">{selectedGuest.name}</h2>
                      <Badge className={
                        selectedGuest.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        selectedGuest.status === 'reserved' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }>
                        {selectedGuest.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedGuest(null)}
                      className="text-slate-400 hover:text-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label className="text-slate-400 text-sm">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-100">{selectedGuest.phone}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Email</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-100">{selectedGuest.email}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Party Size</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-100">{selectedGuest.partySize} guests</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Source</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-100 capitalize">{selectedGuest.source}</span>
                      </div>
                    </div>
                  </div>

                  {selectedGuest.tableNumber && (
                    <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                      <Label className="text-slate-400 text-sm">Assigned Table</Label>
                      <div className="text-2xl text-slate-100 mt-1">Table {selectedGuest.tableNumber}</div>
                    </div>
                  )}

                  {selectedGuest.specialRequests && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <Label className="text-yellow-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Special Requests
                      </Label>
                      <p className="text-slate-100 mt-1">{selectedGuest.specialRequests}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {selectedGuest.status === 'waiting' && (
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            handleOpenMessagePreview(selectedGuest.id);
                            setSelectedGuest(null);
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Notify Guest
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            handleRemoveFromQueue(selectedGuest);
                            setSelectedGuest(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Queue
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      {selectedGuest.status !== 'seated' && (
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setShowTableModal(true);
                          }}
                        >
                          <Grid3x3 className="w-4 h-4 mr-2" />
                          Assign Table
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => setSelectedGuest(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Preview Dialog */}
        <Dialog open={showMessagePreview} onOpenChange={setShowMessagePreview}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Review Message</DialogTitle>
              <DialogDescription className="text-slate-400">
                Review your message before sending it to the guest.
              </DialogDescription>
            </DialogHeader>
            
            {previewGuest && (
              <div className="space-y-4">
                {/* Guest Info */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-slate-100">{previewGuest.name}</div>
                      <div className="text-sm text-slate-400">{previewGuest.phone}</div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {previewGuest.partySize} guests
                    </Badge>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="space-y-2">
                  <Label className="text-slate-200">Message Content</Label>
                  <Textarea
                    value={previewMessage}
                    onChange={(e) => setPreviewMessage(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100 min-h-[120px]"
                    placeholder="Enter your message..."
                  />
                  <p className="text-xs text-slate-500">
                    {previewMessage.length} characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendMessage}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setShowMessagePreview(false);
                      setPreviewGuest(null);
                      setPreviewMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Remove from Queue Confirmation Dialog */}
        <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Remove from Queue
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This action will remove the guest from the waitlist.
              </DialogDescription>
            </DialogHeader>
            
            {guestToRemove && (
              <div className="space-y-4">
                {/* Confirmation Message */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <p className="text-slate-100 mb-3">
                    Would you like to confirm that you are taking{' '}
                    <span className="font-semibold text-blue-400">{guestToRemove.name}</span>{' '}
                    out of the queue?
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>Party of {guestToRemove.partySize}</span>
                    <span>•</span>
                    <span>{guestToRemove.phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={confirmRemoveFromQueue}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Remove
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setShowRemoveConfirm(false);
                      setGuestToRemove(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    No, Keep in Queue
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Guest Selector Dialog - Simple List */}
        <Dialog open={showGuestSelector} onOpenChange={setShowGuestSelector}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Select Guest for Messaging</DialogTitle>
              <DialogDescription className="text-slate-400">
                Choose a guest from reservations or waitlist to send a message.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {guests.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No guests available</p>
                  </div>
                ) : (
                  guests.map((guest) => (
                    <div
                      key={guest.id}
                      onClick={() => {
                        setMessagingGuest(guest);
                        setShowGuestSelector(false);
                      }}
                      className="p-4 rounded-lg border bg-slate-700/50 border-slate-600 hover:border-blue-500 hover:bg-slate-700 cursor-pointer transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-slate-100">{guest.name}</h4>
                          <Badge className={
                            guest.status === 'reserved' ? 'bg-blue-500/20 text-blue-400' :
                            guest.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                            guest.status === 'seated' ? 'bg-green-500/20 text-green-400' :
                            'bg-slate-500/20 text-slate-400'
                          }>
                            {guest.status === 'reserved' ? 'Reservation' : 
                             guest.status === 'waiting' ? 'Waitlist' :
                             guest.status === 'seated' ? 'Seated' : 'Completed'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {guest.partySize} guests
                          </span>
                          <span>•</span>
                          <span>{guest.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Table Selection Modal */}
        <Dialog open={showTableModal} onOpenChange={setShowTableModal}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
            <DialogHeader>
              <DialogTitle>Select Table</DialogTitle>
              <DialogDescription className="text-slate-400">
                Choose an available table for {selectedGuest?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {tables
                .filter(t => t.status === 'available')
                .map((table) => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center border-slate-600 hover:bg-slate-700 hover:border-blue-500"
                    onClick={() => handleAssignTable(table.number)}
                  >
                    <div className="text-xl mb-1">Table {table.number}</div>
                    <div className="text-xs text-slate-400">{table.capacity} seats</div>
                  </Button>
                ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Table Details Dialog */}
        <Dialog open={showTableDetails} onOpenChange={setShowTableDetails}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-blue-400" />
                Table Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedTable && (
              <div className="space-y-4">
                {/* Table Info Card */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl text-slate-100 mb-1">Table {selectedTable.number}</h3>
                      <p className="text-sm text-slate-400 capitalize">{selectedTable.floor} Floor</p>
                    </div>
                    <Badge className={
                      selectedTable.status === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      selectedTable.status === 'reserved' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      selectedTable.status === 'occupied' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }>
                      {selectedTable.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Capacity:</span>
                      <span className="text-slate-100 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedTable.capacity} guests
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Section:</span>
                      <span className="text-slate-100">{selectedTable.section}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shape:</span>
                      <span className="text-slate-100 capitalize">{selectedTable.shape}</span>
                    </div>
                  </div>
                </div>

                {/* Current Guest (if occupied) */}
                {selectedTable.status === 'occupied' && (() => {
                  const currentGuest = guests.find(g => g.tableNumber === selectedTable.number);
                  return currentGuest ? (
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <h4 className="text-sm text-red-400 mb-2">Current Guest</h4>
                      <div className="text-slate-100">{currentGuest.name}</div>
                      <div className="text-sm text-slate-400">Party of {currentGuest.partySize}</div>
                      {currentGuest.seatedTime && (
                        <div className="text-xs text-slate-500 mt-1">
                          Seated at {new Date(currentGuest.seatedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setShowTableDetails(false);
                      setSelectedTable(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Seat Confirmation Dialog */}
        <Dialog open={showSeatConfirm} onOpenChange={setShowSeatConfirm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Confirm Seating
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Would you like to seat this guest at the selected table?
              </DialogDescription>
            </DialogHeader>
            
            {guestToSeat && tableToSeat && (
              <div className="space-y-4">
                {/* Guest Info */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-100">{guestToSeat.name}</div>
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Party of {guestToSeat.partySize}
                      </div>
                    </div>
                  </div>
                  {guestToSeat.specialRequests && (
                    <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {guestToSeat.specialRequests}
                    </div>
                  )}
                </div>

                {/* Table Info */}
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <div className="flex-1 h-px bg-slate-700"></div>
                  <ChevronRight className="w-5 h-5" />
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg text-green-400">Table {tableToSeat.number}</div>
                      <div className="text-sm text-slate-400">
                        {tableToSeat.section} • Seats {tableToSeat.capacity}
                      </div>
                    </div>
                    <Grid3x3 className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={confirmSeatGuest}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Seat
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setShowSeatConfirm(false);
                      setGuestToSeat(null);
                      setTableToSeat(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Message Preview Dialog */}
        <Dialog open={showMessagePreview} onOpenChange={setShowMessagePreview}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Send Message
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Review and confirm the message before sending
              </DialogDescription>
            </DialogHeader>
            
            {previewGuest && (
              <div className="space-y-4">
                {/* Guest Info */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-100">{previewGuest.name}</div>
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {previewGuest.phone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="text-sm text-blue-400 mb-2">Message:</h4>
                  <p className="text-slate-100 text-sm">{previewMessage}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendMessage}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => {
                      setShowMessagePreview(false);
                      setPreviewGuest(null);
                      setPreviewMessage('');
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
