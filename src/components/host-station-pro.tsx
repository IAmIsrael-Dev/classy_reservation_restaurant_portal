/**
 * HOST STATION PRO - Developer-Ready Seating Management
 * 
 * DEFAULT LANDING: Overview screen
 * MANUAL CONTROL: All state changes require explicit host action
 * 
 * DATA_MODEL - Example JSON Schemas for Developers:
 * 
 * Table Schema:
 * {
 *   "id": "t-001",
 *   "number": 8,
 *   "areaId": "area-main",
 *   "capacity": 4,
 *   "shape": "round" | "square" | "rectangular",
 *   "state": "available" | "reserved" | "occupied" | "cleaning",
 *   "position": { "x": 100, "y": 150 },
 *   "serverId": "server-001",
 *   "reservationId": null | "res-001"
 * }
 * 
 * Area Schema:
 * {
 *   "id": "area-001",
 *   "name": "Main Dining",
 *   "description": "Primary dining area",
 *   "dimensions": { "width": 20, "height": 15 },
 *   "tableCount": 12,
 *   "occupancy": 0.75,
 *   "serverId": "server-001"
 * }
 * 
 * Reservation Schema:
 * {
 *   "id": "res-001",
 *   "guestName": "John Smith",
 *   "phone": "(555) 123-4567",
 *   "email": "john@example.com",
 *   "partySize": 4,
 *   "time": "2025-10-17T19:00:00Z",
 *   "status": "pending" | "seated" | "completed" | "cancelled",
 *   "tableId": null | "t-001",
 *   "vip": false,
 *   "notes": "Anniversary celebration",
 *   "source": "phone" | "online" | "walkin" | "app"
 * }
 * 
 * Server Schema:
 * {
 *   "id": "server-001",
 *   "name": "Alice Johnson",
 *   "section": "Main Dining",
 *   "tableIds": ["t-001", "t-002", "t-003"],
 *   "activeCovers": 12,
 *   "status": "active" | "break" | "offline"
 * }
 * 
 * Waitlist Entry Schema:
 * {
 *   "id": "wait-001",
 *   "guestName": "Jane Doe",
 *   "partySize": 2,
 *   "phone": "(555) 987-6543",
 *   "position": 3,
 *   "estimatedWait": 25,
 *   "addedAt": "2025-10-17T18:30:00Z",
 *   "notified": false
 * }
 * 
 * Event Types:
 * - table_repositioned: { tableId, newPosition: {x, y} }
 * - reservation_seated: { reservationId, tableId, timestamp }
 * - reservation_updated: { reservationId, changes: {...} }
 * - table_state_changed: { tableId, oldState, newState }
 * - server_assigned: { serverId, tableIds: [...] }
 * - area_created: { areaId, name, dimensions }
 * - waitlist_seated: { waitlistId, tableId, timestamp }
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import {
  LayoutGrid,
  List,
  Clock,
  Search,
  Filter,
  Undo2,
  Redo2,
  Save,
  Plus,
  Users,
  ZoomIn,
  ZoomOut,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Activity,
  Calendar,
  Phone,
  Star,
  Timer,
  MoreVertical,
  Eye,
  UserCheck,
  Sparkles,
  Home,
  Table as TableIcon,
  UserCircle,
} from 'lucide-react';

// ===== TYPE DEFINITIONS =====
type TableShape = 'round' | 'square' | 'rectangular';
type TableState = 'available' | 'reserved' | 'occupied' | 'cleaning';
type ReservationStatus = 'pending' | 'seated' | 'completed' | 'cancelled';
type ServerStatus = 'active' | 'break' | 'offline';

interface Position {
  x: number;
  y: number;
}

interface Table {
  id: string;
  number: number;
  areaId: string;
  capacity: number;
  shape: TableShape;
  state: TableState;
  position: Position;
  serverId?: string;
  reservationId?: string;
}

interface Area {
  id: string;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  tableCount: number;
  occupancy: number;
  serverId?: string;
}

interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  partySize: number;
  time: string;
  status: ReservationStatus;
  tableId?: string;
  vip: boolean;
  notes: string;
  source: 'phone' | 'online' | 'walkin' | 'app';
  guestHistory?: string;
}

interface Server {
  id: string;
  name: string;
  section: string;
  tableIds: string[];
  activeCovers: number;
  status: ServerStatus;
}

interface WaitlistEntry {
  id: string;
  guestName: string;
  partySize: number;
  phone: string;
  position: number;
  estimatedWait: number;
  addedAt: string;
  notified: boolean;
}

// ===== MOCK DATA =====
const mockAreas: Area[] = [
  {
    id: 'area-main',
    name: 'Main Dining',
    description: 'Primary dining area with window views',
    dimensions: { width: 20, height: 15 },
    tableCount: 12,
    occupancy: 0.67,
    serverId: 'server-001',
  },
  {
    id: 'area-bar',
    name: 'Bar Area',
    description: 'High-top tables near the bar',
    dimensions: { width: 15, height: 10 },
    tableCount: 8,
    occupancy: 0.88,
    serverId: 'server-002',
  },
  {
    id: 'area-patio',
    name: 'Patio',
    description: 'Outdoor seating area',
    dimensions: { width: 18, height: 12 },
    tableCount: 10,
    occupancy: 0.40,
    serverId: 'server-003',
  },
];

const mockTables: Table[] = [
  { id: 't-001', number: 1, areaId: 'area-main', capacity: 2, shape: 'round', state: 'occupied', position: { x: 50, y: 50 }, serverId: 'server-001', reservationId: 'res-001' },
  { id: 't-002', number: 2, areaId: 'area-main', capacity: 2, shape: 'round', state: 'available', position: { x: 150, y: 50 }, serverId: 'server-001' },
  { id: 't-003', number: 3, areaId: 'area-main', capacity: 4, shape: 'square', state: 'reserved', position: { x: 250, y: 50 }, serverId: 'server-001', reservationId: 'res-002' },
  { id: 't-004', number: 4, areaId: 'area-main', capacity: 4, shape: 'square', state: 'available', position: { x: 350, y: 50 }, serverId: 'server-001' },
  { id: 't-005', number: 5, areaId: 'area-main', capacity: 6, shape: 'rectangular', state: 'occupied', position: { x: 50, y: 150 }, serverId: 'server-001', reservationId: 'res-003' },
  { id: 't-006', number: 6, areaId: 'area-main', capacity: 4, shape: 'square', state: 'cleaning', position: { x: 200, y: 150 } },
  { id: 't-007', number: 7, areaId: 'area-main', capacity: 2, shape: 'round', state: 'available', position: { x: 350, y: 150 }, serverId: 'server-001' },
  { id: 't-008', number: 8, areaId: 'area-main', capacity: 8, shape: 'rectangular', state: 'reserved', position: { x: 50, y: 250 }, serverId: 'server-001', reservationId: 'res-004' },
];

const mockReservations: Reservation[] = [
  {
    id: 'res-001',
    guestName: 'Sarah Johnson',
    phone: '(555) 123-4567',
    email: 'sarah.j@email.com',
    partySize: 2,
    time: '2025-10-17T19:00:00Z',
    status: 'seated',
    tableId: 't-001',
    vip: true,
    notes: 'Window seat preferred',
    source: 'online',
    guestHistory: '{{guest_history}}',
  },
  {
    id: 'res-002',
    guestName: 'Michael Chen',
    phone: '(555) 234-5678',
    email: 'mchen@email.com',
    partySize: 4,
    time: '2025-10-17T19:15:00Z',
    status: 'pending',
    tableId: 't-003',
    vip: false,
    notes: 'Birthday celebration',
    source: 'phone',
    guestHistory: '{{guest_history}}',
  },
  {
    id: 'res-003',
    guestName: 'Emma Davis',
    phone: '(555) 345-6789',
    email: 'emma.d@email.com',
    partySize: 6,
    time: '2025-10-17T19:30:00Z',
    status: 'seated',
    tableId: 't-005',
    vip: false,
    notes: 'Business dinner',
    source: 'app',
    guestHistory: '{{guest_history}}',
  },
  {
    id: 'res-004',
    guestName: 'David Martinez',
    phone: '(555) 456-7890',
    email: 'david.m@email.com',
    partySize: 8,
    time: '2025-10-17T20:00:00Z',
    status: 'pending',
    tableId: 't-008',
    vip: true,
    notes: 'Anniversary - needs champagne',
    source: 'online',
    guestHistory: '{{guest_history}}',
  },
  {
    id: 'res-005',
    guestName: 'Lisa Anderson',
    phone: '(555) 567-8901',
    email: 'lisa.a@email.com',
    partySize: 2,
    time: '2025-10-17T20:15:00Z',
    status: 'pending',
    vip: false,
    notes: 'Gluten-free options needed',
    source: 'phone',
    guestHistory: '{{guest_history}}',
  },
];

const mockServers: Server[] = [
  { id: 'server-001', name: 'Alice Johnson', section: 'Main Dining', tableIds: ['t-001', 't-002', 't-003', 't-004', 't-005', 't-007', 't-008'], activeCovers: 18, status: 'active' },
  { id: 'server-002', name: 'Bob Williams', section: 'Bar Area', tableIds: [], activeCovers: 12, status: 'active' },
  { id: 'server-003', name: 'Carol Martinez', section: 'Patio', tableIds: [], activeCovers: 8, status: 'active' },
];

const mockWaitlist: WaitlistEntry[] = [
  { id: 'wait-001', guestName: 'John Smith', partySize: 2, phone: '(555) 678-9012', position: 1, estimatedWait: 15, addedAt: '2025-10-17T18:45:00Z', notified: false },
  { id: 'wait-002', guestName: 'Jane Doe', partySize: 4, phone: '(555) 789-0123', position: 2, estimatedWait: 25, addedAt: '2025-10-17T18:50:00Z', notified: false },
  { id: 'wait-003', guestName: 'Robert Brown', partySize: 3, phone: '(555) 890-1234', position: 3, estimatedWait: 35, addedAt: '2025-10-17T18:55:00Z', notified: false },
];

// ===== TABLE COMPONENT WITH VARIANTS =====
// Component naming: Table / <shape> / cap-<capacity> / state-<state>
// aria-label: "Table {{tableId}} - {{capacity}} seats - {{state}}"
interface TableComponentProps {
  table: Table;
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  scale: number;
  showServerOverlay?: boolean;
  serverColor?: string;
}

function TableComponent({
  table,
  selected,
  highlighted,
  onClick,
  onDoubleClick,
  onDragStart,
  scale,
  showServerOverlay,
  serverColor,
}: TableComponentProps) {
  const stateColors = {
    available: 'bg-green-500/20 border-green-500',
    reserved: 'bg-blue-500/20 border-blue-500',
    occupied: 'bg-red-500/20 border-red-500',
    cleaning: 'bg-yellow-500/20 border-yellow-500',
  };

  const stateIcons = {
    available: <Check className="w-3 h-3" />,
    reserved: <Clock className="w-3 h-3" />,
    occupied: <Users className="w-3 h-3" />,
    cleaning: <Activity className="w-3 h-3" />,
  };

  const shapeClasses = {
    round: 'rounded-full',
    square: 'rounded-lg',
    rectangular: 'rounded-lg',
  };

  const sizeMap = {
    2: { width: 50, height: 50 },
    4: { width: 60, height: 60 },
    6: { width: 80, height: 60 },
    8: { width: 100, height: 70 },
    10: { width: 120, height: 80 },
  };

  const size = sizeMap[table.capacity as keyof typeof sizeMap] || sizeMap[4];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`
        absolute cursor-move transition-all
        ${shapeClasses[table.shape]}
        ${stateColors[table.state]}
        ${selected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
        ${highlighted ? 'ring-4 ring-amber-400 animate-pulse' : ''}
        border-2 flex flex-col items-center justify-center
        hover:scale-110 hover:shadow-lg
        ${showServerOverlay && serverColor ? `${serverColor} opacity-80` : ''}
      `}
      style={{
        left: table.position.x * scale,
        top: table.position.y * scale,
        width: size.width * scale,
        height: size.height * scale,
        minWidth: '44px',
        minHeight: '44px',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Table ${table.number} - ${table.capacity} seats - ${table.state}`}
    >
      <div className="text-xs text-white font-bold">T{table.number}</div>
      <div className="text-[10px] text-white/80 flex items-center gap-0.5">
        <Users className="w-2.5 h-2.5" />
        {table.capacity}
      </div>
      <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5">
        {stateIcons[table.state]}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export function HostStationPro() {
  // View state
  const [currentView, setCurrentView] = useState<'overview' | 'floorplan' | 'list' | 'timeline'>('overview');
  const [floorView, setFloorView] = useState<'floor' | 'list' | 'timeline'>('floor');
  
  // Floor plan state
  const [selectedArea, setSelectedArea] = useState<Area>(mockAreas[0]);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [highlightedTables, setHighlightedTables] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showServerOverlay, setShowServerOverlay] = useState(false);
  
  // Data state
  const [areas] = useState<Area[]>(mockAreas);
  const [reservations] = useState<Reservation[]>(mockReservations);
  const [servers] = useState<Server[]>(mockServers);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(mockWaitlist);
  
  // UI state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [showWaitlistDrawer, setShowWaitlistDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | TableState>('all');
  const [draggedWaitlist, setDraggedWaitlist] = useState<WaitlistEntry | null>(null);

  // Computed values (placeholders for dynamic data)
  const totalReservations = reservations.filter(r => r.status !== 'cancelled').length; // {{total_reservations}}
  const waitlistCount = waitlist.length; // {{waitlist_count}}
  const activeTables = tables.filter(t => t.state === 'occupied').length;
  const occupancyPercent = Math.round((activeTables / tables.length) * 100);
  const upcomingReservations = reservations
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(0, 5);

  // ===== HANDLERS =====

  const handleSeatWaitlist = (waitlistEntry: WaitlistEntry, table: Table) => {
    // Manual host action: seat waitlist entry
    if (table.state === 'occupied' || table.state === 'cleaning') {
      toast.error(`Table ${table.number} is not available`);
      return;
    }

    if (table.capacity < waitlistEntry.partySize) {
      toast.error(`Table ${table.number} only seats ${table.capacity}, party size is ${waitlistEntry.partySize}`);
      return;
    }

    // Update states
    setTables(tables.map(t =>
      t.id === table.id ? { ...t, state: 'occupied' } : t
    ));
    setWaitlist(waitlist.filter(w => w.id !== waitlistEntry.id));

    toast.success(`${waitlistEntry.guestName} seated at Table ${table.number}`, {
      description: `Party of ${waitlistEntry.partySize} from waitlist`,
    });
    setDraggedWaitlist(null);
    setHighlightedTables([]);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (table.reservationId) {
      const res = reservations.find(r => r.id === table.reservationId);
      if (res) setSelectedReservation(res);
    }
  };

  const handleTableStateChange = (tableId: string, newState: TableState) => {
    // Manual host action: change table state
    setTables(tables.map(t =>
      t.id === tableId ? { ...t, state: newState } : t
    ));
    toast.success('Table status updated');
  };

  const handleWaitlistDragStart = (entry: WaitlistEntry) => {
    setDraggedWaitlist(entry);
    // Highlight tables that fit capacity
    const suitable = tables.filter(t =>
      t.capacity >= entry.partySize &&
      (t.state === 'available' || t.state === 'reserved')
    );
    setHighlightedTables(suitable.map(t => t.id));
  };

  const handleWaitlistDragEnd = () => {
    setDraggedWaitlist(null);
    setHighlightedTables([]);
  };

  const filteredTables = tables.filter(t => {
    if (filterState !== 'all' && t.state !== filterState) return false;
    if (t.areaId !== selectedArea.id) return false;
    return true;
  });

  // ===== RENDER FUNCTIONS =====

  // OVERVIEW SCREEN (DEFAULT)
  const renderOverview = () => (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-slate-100">Bella Vista Restaurant</h2>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
              <span>Dinner Service</span>
              <Separator orientation="vertical" className="h-4 bg-slate-700" />
              <span>Friday, October 17, 2025</span>
              <Separator orientation="vertical" className="h-4 bg-slate-700" />
              <span>7:42 PM</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddReservation(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reservation
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWaitlistDrawer(true)}
              className="border-slate-700"
            >
              <Timer className="w-4 h-4 mr-2" />
              View Waitlist ({waitlistCount})
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('floorplan')}
              className="border-slate-700"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Open Floor Plan
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Total Reservations</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl text-slate-100 mb-1">{totalReservations}</div>
            <div className="text-xs text-slate-500">Today</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Waitlist</span>
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl text-slate-100 mb-1">{waitlistCount}</div>
            <div className="text-xs text-slate-500">~{Math.round(waitlist.reduce((sum, w) => sum + w.estimatedWait, 0) / waitlist.length || 0)} min avg</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Active Tables</span>
              <TableIcon className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl text-slate-100 mb-1">{activeTables}/{tables.length}</div>
            <div className="text-xs text-slate-500">In use</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Occupancy</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl text-slate-100 mb-1">{occupancyPercent}%</div>
            <div className="text-xs text-slate-500">Current</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Turnover Rate</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl text-slate-100 mb-1">1.8</div>
            <div className="text-xs text-slate-500">Per table</div>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Alerts</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl text-slate-100 mb-1">2</div>
            <div className="text-xs text-slate-500">Issues</div>
          </Card>
        </div>

        {/* Upcoming Reservations */}
        <Card className="bg-slate-900/50 border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-slate-100">Upcoming Reservations</h3>
            <p className="text-sm text-slate-400 mt-1">Next 2 hours</p>
          </div>
          <div className="divide-y divide-slate-800">
            {upcomingReservations.map((res) => (
              <div
                key={res.id}
                className="p-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => setSelectedReservation(res)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg text-slate-100">
                        {new Date(res.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(res.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-10 bg-slate-700" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100">{res.guestName}</span>
                        {res.vip && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <Star className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {res.partySize} guests
                        </div>
                        {res.notes && (
                          <>
                            <span>•</span>
                            <span>{res.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        res.status === 'seated'
                          ? 'border-green-500/30 text-green-400'
                          : 'border-blue-500/30 text-blue-400'
                      }
                    >
                      {res.status}
                    </Badge>
                    {res.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(res);
                          setCurrentView('floorplan');
                        }}
                      >
                        Seat
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReservation(res);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right Panel - Quick Actions & Alerts */}
      <div className="w-80 border-l border-slate-800 p-6 space-y-6 overflow-y-auto bg-slate-900/30">
        <div>
          <h3 className="text-slate-100 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start border-slate-700"
              onClick={() => setShowAddReservation(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reservation
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-slate-700"
              onClick={() => setCurrentView('floorplan')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Go to Floor Plan
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-slate-700"
              onClick={() => setCurrentView('timeline')}
            >
              <Clock className="w-4 h-4 mr-2" />
              View Timeline
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-slate-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Servers
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Problem Reservations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-slate-100">Alerts</h3>
          </div>
          <div className="space-y-2">
            <Card className="p-3 bg-red-500/10 border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-300">Late Arrival</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Michael Chen (7:15 PM) - No show yet
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-amber-500/10 border-amber-500/30">
              <div className="flex items-start gap-2">
                <Timer className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-300">Long Wait</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Waitlist position #1 - 25 min wait
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Server Status */}
        <div>
          <h3 className="text-slate-100 mb-4">Server Status</h3>
          <div className="space-y-2">
            {servers.map((server) => (
              <Card key={server.id} className="p-3 bg-slate-900/50 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-100">{server.name}</span>
                  <Badge
                    variant="outline"
                    className="border-green-500/30 text-green-400 text-xs"
                  >
                    {server.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{server.section}</span>
                  <span>•</span>
                  <span>{server.activeCovers} covers</span>
                  <span>•</span>
                  <span>{server.tableIds.length} tables</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // FLOOR PLAN SECTION
  const renderFloorPlan = () => (
    <div className="h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('overview')}
            >
              <Home className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Separator orientation="vertical" className="h-6 bg-slate-700" />
            <Tabs value={floorView} onValueChange={(v) => setFloorView(v as 'floor' | 'list' | 'timeline')}>
              <TabsList className="bg-slate-800">
                <TabsTrigger value="floor">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Floor Layout
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="w-4 h-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Clock className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search reservations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-slate-800 border-slate-700"
                aria-label="Search reservations by name or phone"
              />
            </div>

            {/* Filter */}
            <Select value={filterState} onValueChange={(v) => setFilterState(v as 'all' | TableState)}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 bg-slate-700" />

            {/* Undo/Redo */}
            <Button variant="ghost" size="sm" disabled>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Redo2 className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 bg-slate-700" />

            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              Save Layout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {floorView === 'floor' && (
          <>
            {/* Left Panel - Areas */}
            <div className="w-64 border-r border-slate-800 p-4 space-y-4 overflow-y-auto bg-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-100">Areas</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => setShowAddArea(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {areas.map((area) => (
                  <Card
                    key={area.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedArea.id === area.id
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => setSelectedArea(area)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm text-slate-100">{area.name}</h4>
                      <Badge variant="outline" className="border-slate-700 text-xs">
                        {Math.round(area.occupancy * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{area.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{area.tableCount} tables</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArea(area);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="bg-slate-800" />

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-400">Snap to Grid</Label>
                  <Switch
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                    aria-label="Toggle snap to grid"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-400">Server Overlay</Label>
                  <Switch
                    checked={showServerOverlay}
                    onCheckedChange={setShowServerOverlay}
                    aria-label="Toggle server section overlay"
                  />
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Zoom Controls */}
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Zoom: {zoom}%</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    min={50}
                    max={200}
                    step={10}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Center Canvas */}
            <div className="flex-1 relative overflow-auto bg-slate-950">
              <div className="absolute inset-0 p-8">
                {/* Grid background */}
                {snapToGrid && (
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
                      backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
                    }}
                  />
                )}

                {/* Canvas */}
                <div className="relative min-h-full min-w-full">
                  {filteredTables.map((table) => (
                    <TableComponent
                      key={table.id}
                      table={table}
                      selected={selectedTable?.id === table.id}
                      highlighted={highlightedTables.includes(table.id)}
                      onClick={() => handleTableClick(table)}
                      onDoubleClick={() => {
                        handleTableClick(table);
                        // Quick edit modal would open here
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('tableId', table.id);
                      }}
                      scale={zoom / 100}
                      showServerOverlay={showServerOverlay}
                      serverColor={
                        table.serverId
                          ? servers.findIndex(s => s.id === table.serverId) === 0
                            ? 'bg-blue-500/30'
                            : servers.findIndex(s => s.id === table.serverId) === 1
                            ? 'bg-purple-500/30'
                            : 'bg-green-500/30'
                          : undefined
                      }
                    />
                  ))}

                  {/* Drop zone indicator when dragging waitlist */}
                  {draggedWaitlist && (
                    <div className="absolute inset-0 bg-cyan-500/5 border-2 border-dashed border-cyan-500/30 rounded flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-cyan-400 text-lg mb-2">
                          Drop on highlighted table to seat
                        </p>
                        <p className="text-slate-400 text-sm">
                          {draggedWaitlist.guestName} - Party of {draggedWaitlist.partySize}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Context */}
            <div className="w-96 border-l border-slate-800 overflow-y-auto bg-slate-900/30">
              {selectedTable ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl text-slate-100">Table {selectedTable.number}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={
                            selectedTable.state === 'available'
                              ? 'border-green-500/30 text-green-400'
                              : selectedTable.state === 'occupied'
                              ? 'border-red-500/30 text-red-400'
                              : selectedTable.state === 'reserved'
                              ? 'border-blue-500/30 text-blue-400'
                              : 'border-yellow-500/30 text-yellow-400'
                          }
                        >
                          {selectedTable.state}
                        </Badge>
                        <Badge variant="outline" className="border-slate-700">
                          <Users className="w-3 h-3 mr-1" />
                          Seats {selectedTable.capacity}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTable(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Table Details */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-400">Shape</Label>
                      <p className="text-sm text-slate-100 capitalize">{selectedTable.shape}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Location</Label>
                      <p className="text-sm text-slate-100">{selectedArea.name}</p>
                    </div>
                    {selectedTable.serverId && (
                      <div>
                        <Label className="text-xs text-slate-400">Assigned Server</Label>
                        <p className="text-sm text-slate-100">
                          {servers.find(s => s.id === selectedTable.serverId)?.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Current Reservation */}
                  {selectedTable.reservationId && selectedReservation && (
                    <div>
                      <h4 className="text-sm text-slate-400 mb-3">Current Reservation</h4>
                      <Card className="p-4 bg-slate-800/50 border-slate-700">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-slate-100">{selectedReservation.guestName}</span>
                              {selectedReservation.vip && (
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              )}
                            </div>
                            <div className="text-sm text-slate-400">
                              Party of {selectedReservation.partySize}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 text-blue-400"
                          >
                            {selectedReservation.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            {new Date(selectedReservation.time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-4 h-4" />
                            {selectedReservation.phone}
                          </div>
                          {selectedReservation.notes && (
                            <div className="p-2 bg-slate-900/50 rounded text-slate-300 text-xs">
                              {selectedReservation.notes}
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}

                  <Separator className="bg-slate-800" />

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="text-sm text-slate-400 mb-3">Quick Actions</h4>
                    
                    {selectedTable.state === 'available' && (
                      <Button
                        className="w-full justify-start bg-cyan-600 hover:bg-cyan-700"
                        onClick={() => {
                          // Open assign reservation modal
                          toast.info('Assign reservation to table');
                        }}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Assign Reservation
                      </Button>
                    )}

                    {selectedTable.state === 'occupied' && (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => handleTableStateChange(selectedTable.id, 'cleaning')}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Cleaning
                      </Button>
                    )}

                    {selectedTable.state === 'cleaning' && (
                      <Button
                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                        onClick={() => handleTableStateChange(selectedTable.id, 'available')}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark Available
                      </Button>
                    )}

                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => {
                        // Open server assignment
                        toast.info('Assign server');
                      }}
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Assign Server
                    </Button>

                    <Button
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Table
                    </Button>

                    <Button
                      className="w-full justify-start text-red-400 hover:text-red-300"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Table
                    </Button>
                  </div>

                  {/* AI Suggestions */}
                  <Separator className="bg-slate-800" />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm text-slate-400">AI Suggestions</h4>
                    </div>
                    <Card className="p-3 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
                      <p className="text-sm text-cyan-300 mb-2">
                        Perfect for party of 4
                      </p>
                      <p className="text-xs text-slate-400">
                        This table matches the capacity and is in Alice's section, balancing server load.
                      </p>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center">
                    <TableIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">Select a table to view details</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* LIST VIEW */}
        {floorView === 'list' && (
          <div className="flex-1 p-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-slate-100">All Reservations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-4 text-sm text-slate-400">Time</th>
                      <th className="text-left p-4 text-sm text-slate-400">Guest</th>
                      <th className="text-left p-4 text-sm text-slate-400">Party</th>
                      <th className="text-left p-4 text-sm text-slate-400">Table</th>
                      <th className="text-left p-4 text-sm text-slate-400">Status</th>
                      <th className="text-left p-4 text-sm text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => (
                      <tr
                        key={res.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => setSelectedReservation(res)}
                      >
                        <td className="p-4 text-sm text-slate-100">
                          {new Date(res.time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-100">{res.guestName}</span>
                            {res.vip && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-100">{res.partySize}</td>
                        <td className="p-4 text-sm text-slate-100">
                          {res.tableId
                            ? `T${tables.find(t => t.id === res.tableId)?.number}`
                            : '-'}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              res.status === 'seated'
                                ? 'border-green-500/30 text-green-400'
                                : res.status === 'pending'
                                ? 'border-blue-500/30 text-blue-400'
                                : 'border-slate-700'
                            }
                          >
                            {res.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {res.status === 'pending' && (
                              <Button size="sm" variant="outline" className="border-slate-700">
                                Seat
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TIMELINE VIEW */}
        {floorView === 'timeline' && (
          <div className="flex-1 p-6">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <div className="mb-4">
                <h3 className="text-slate-100 mb-2">Timeline View</h3>
                <p className="text-sm text-slate-400">
                  Drag reservations horizontally to reschedule or vertically to change tables
                </p>
              </div>
              
              <div className="relative">
                {/* Time axis */}
                <div className="flex border-b border-slate-800 pb-2 mb-4">
                  {Array.from({ length: 12 }, (_, i) => 17 + i).map((hour) => (
                    <div key={hour} className="flex-1 text-center text-xs text-slate-400">
                      {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                    </div>
                  ))}
                </div>

                {/* Table rows */}
                <div className="space-y-2">
                  {tables.slice(0, 8).map((table) => (
                    <div key={table.id} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-slate-400">
                        Table {table.number}
                      </div>
                      <div className="flex-1 relative h-12 bg-slate-800/30 rounded">
                        {/* Reservation blocks would be positioned here */}
                        {reservations
                          .filter(r => r.tableId === table.id)
                          .map((res) => {
                            const hour = new Date(res.time).getHours();
                            const left = ((hour - 17) / 12) * 100;
                            return (
                              <div
                                key={res.id}
                                className="absolute h-full bg-cyan-600 rounded px-2 flex items-center cursor-move hover:bg-cyan-700"
                                style={{ left: `${left}%`, width: '8%' }}
                              >
                                <span className="text-xs text-white truncate">
                                  {res.guestName}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  // ===== MODALS & DRAWERS =====

  // Waitlist Drawer
  const WaitlistDrawer = (
    <Drawer open={showWaitlistDrawer} onOpenChange={setShowWaitlistDrawer}>
      <DrawerContent className="bg-slate-900 border-slate-800">
        <DrawerHeader>
          <DrawerTitle className="text-slate-100">Waitlist ({waitlist.length})</DrawerTitle>
        </DrawerHeader>
        <div className="p-6 space-y-3">
          {waitlist.map((entry) => (
            <Card
              key={entry.id}
              draggable
              onDragStart={() => handleWaitlistDragStart(entry)}
              onDragEnd={handleWaitlistDragEnd}
              className="p-4 bg-slate-800/50 border-slate-700 cursor-move hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      #{entry.position}
                    </Badge>
                    <span className="text-slate-100">{entry.guestName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {entry.partySize}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {entry.phone}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Est. Wait</div>
                  <div className="text-lg text-cyan-400">{entry.estimatedWait} min</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => {
                    // Find suitable table
                    const suitableTable = tables.find(
                      t => t.capacity >= entry.partySize && t.state === 'available'
                    );
                    if (suitableTable) {
                      handleSeatWaitlist(entry, suitableTable);
                    } else {
                      toast.error('No suitable tables available');
                    }
                  }}
                >
                  Seat Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700"
                >
                  Notify
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );

  // Add Reservation Modal
  const AddReservationModal = (
    <Dialog open={showAddReservation} onOpenChange={setShowAddReservation}>
      <DialogContent className="bg-slate-900 border-slate-800" aria-describedby="add-reservation-description">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add Reservation</DialogTitle>
          <DialogDescription id="add-reservation-description" className="text-slate-400">
            Create a new reservation for a guest
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Guest Name</Label>
              <Input
                placeholder="John Smith"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Party Size</Label>
              <Select>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {[2, 4, 6, 8].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} guests</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">Phone</Label>
            <Input
              placeholder="(555) 123-4567"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">Time</Label>
            <Input
              type="time"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddReservation(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={() => {
                toast.success('Reservation added');
                setShowAddReservation(false);
              }}
            >
              Add Reservation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Add Area Modal
  const AddAreaModal = (
    <Dialog open={showAddArea} onOpenChange={setShowAddArea}>
      <DialogContent className="bg-slate-900 border-slate-800" aria-describedby="add-area-description">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add Area</DialogTitle>
          <DialogDescription id="add-area-description" className="text-slate-400">
            Create a new dining area or section
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-400">Area Name</Label>
            <Input
              placeholder="e.g., Private Room"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">Description</Label>
            <Input
              placeholder="Brief description"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Width (grid units)</Label>
              <Input
                type="number"
                defaultValue={20}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Height (grid units)</Label>
              <Input
                type="number"
                defaultValue={15}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddArea(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={() => {
                toast.success('Area created');
                setShowAddArea(false);
              }}
            >
              Create Area
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ===== MAIN RENDER =====
  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {currentView === 'overview' && renderOverview()}
      {currentView === 'floorplan' && renderFloorPlan()}
      
      {WaitlistDrawer}
      {AddReservationModal}
      {AddAreaModal}
    </div>
  );
}
