import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DndProvider, useDrag, useDrop, type DragSourceMonitor, type DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import {
  LayoutGrid,
  List,
  Clock,
  Users,
  Search,
  Filter,
  Bell,
  AlertTriangle,
  Phone,
  MessageSquare,
  Settings as SettingsIcon,
  Plus,
  Check,
  Utensils,
  Timer,
  BookOpen,
  Sparkles,
  BarChart3,
  MapPin,
  ChevronRight,
  Mail,
  Edit,
} from 'lucide-react';

// ===== TYPES =====
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
  estimatedWait?: number;
  notified?: boolean;
  preferences?: {
    seating?: string[];
    dietary?: string[];
    occasions?: string[];
  };
  visitCount?: number;
  vip?: boolean;
  serverName?: string;
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
  serverName?: string;
}

interface ServerSection {
  id: string;
  serverName: string;
  tables: number[];
  color: string;
}

interface ShiftNote {
  id: string;
  type: 'reservation' | 'staff' | 'menu' | 'general';
  message: string;
  timestamp: string;
  author: string;
}

// ===== MOCK DATA =====
const generateMockGuests = (): Guest[] => {
  const names = ['Sarah Johnson', 'Michael Chen', 'Emma Williams', 'David Brown', 'Lisa Garcia', 
    'James Martinez', 'Olivia Taylor', 'Daniel Anderson', 'Sophia Lee', 'Matthew White'];
  const sources: ('walk-in' | 'phone' | 'online' | 'app')[] = ['walk-in', 'phone', 'online', 'app'];
  
  const guests: Guest[] = [];
  
  // Waitlist (8 guests)
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
      waitTime: Math.floor(Math.random() * 45) + 10,
      estimatedWait: Math.floor(Math.random() * 30) + 15,
      specialRequests: i % 3 === 0 ? 'High chair needed' : undefined,
      preferences: {
        seating: i % 2 === 0 ? ['Window', 'Quiet'] : ['Bar Area'],
        dietary: i % 4 === 0 ? ['Gluten-Free', 'Vegetarian'] : [],
      },
      visitCount: Math.floor(Math.random() * 20),
      vip: i === 0 || i === 5,
    });
  }
  
  // Reservations (12 guests)
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
      specialRequests: i % 4 === 0 ? 'Birthday celebration 🎂' : i % 5 === 0 ? 'Anniversary' : undefined,
      preferences: {
        seating: ['Window', 'Romantic'],
        dietary: i % 3 === 0 ? ['Pescatarian'] : [],
        occasions: i % 4 === 0 ? ['Birthday'] : [],
      },
      visitCount: Math.floor(Math.random() * 30),
      vip: i === 10 || i === 15,
    });
  }
  
  // Seated (10 guests)
  for (let i = 20; i < 30; i++) {
    guests.push({
      id: `seated-${i}`,
      name: names[i % names.length],
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
      partySize: Math.floor(Math.random() * 6) + 2,
      status: 'seated',
      tableNumber: i - 19,
      seatedTime: new Date(Date.now() - Math.random() * 5400000).toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      serverName: ['Alex', 'Jordan', 'Casey', 'Morgan'][Math.floor(Math.random() * 4)],
      visitCount: Math.floor(Math.random() * 15),
    });
  }
  
  return guests;
};

const generateMockTables = (): Table[] => {
  const tables: Table[] = [];
  const sections = ['Main Dining', 'Main Dining', 'Patio', 'Bar', 'Private'];
  const shapes: ('round' | 'square' | 'rectangle')[] = ['round', 'square', 'rectangle'];
  const servers = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor'];
  
  for (let i = 1; i <= 30; i++) {
    const status: ('available' | 'occupied' | 'reserved' | 'cleaning')[] = 
      i <= 10 ? ['occupied'] : 
      i <= 15 ? ['reserved'] : 
      i <= 25 ? ['available'] : 
      ['cleaning'];
    
    tables.push({
      id: i,
      number: i,
      capacity: i % 7 === 0 ? 8 : i % 5 === 0 ? 6 : i % 3 === 0 ? 4 : 2,
      status: status[0],
      section: sections[Math.floor((i - 1) / 6)],
      shape: shapes[(i - 1) % 3],
      position: {
        x: ((i - 1) % 6) * 160 + 50,
        y: Math.floor((i - 1) / 6) * 140 + 50,
      },
      serverName: servers[Math.floor((i - 1) / 6)],
    });
  }
  
  return tables;
};

const mockServerSections: ServerSection[] = [
  { id: 's1', serverName: 'Alex', tables: [1, 2, 3, 4, 5, 6], color: 'blue' },
  { id: 's2', serverName: 'Jordan', tables: [7, 8, 9, 10, 11, 12], color: 'purple' },
  { id: 's3', serverName: 'Casey', tables: [13, 14, 15, 16, 17, 18], color: 'green' },
  { id: 's4', serverName: 'Morgan', tables: [19, 20, 21, 22, 23, 24], color: 'amber' },
  { id: 's5', serverName: 'Taylor', tables: [25, 26, 27, 28, 29, 30], color: 'rose' },
];

const mockShiftNotes: ShiftNote[] = [
  { id: '1', type: 'menu', message: 'Salmon is 86\'d tonight', timestamp: new Date().toISOString(), author: 'Chef Maria' },
  { id: '2', type: 'reservation', message: 'VIP party of 8 arriving at 8 PM', timestamp: new Date().toISOString(), author: 'Manager' },
  { id: '3', type: 'staff', message: 'Alex finishing shift at 9 PM', timestamp: new Date().toISOString(), author: 'Manager' },
];

// ===== DRAGGABLE COMPONENTS =====
interface DraggableGuestCardProps {
  guest: Guest;
  onClick: () => void;
  compact?: boolean;
}

function DraggableGuestCard({ guest, onClick, compact = false }: DraggableGuestCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GUEST',
    item: { guest },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const formatTime = (time?: string) => {
    if (!time) return '';
    return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const statusColors = {
    waiting: 'border-l-yellow-500 bg-yellow-500/5',
    reserved: 'border-l-blue-500 bg-blue-500/5',
    seated: 'border-l-green-500 bg-green-500/5',
    completed: 'border-l-slate-500 bg-slate-500/5',
  };

  const sourceIcons = {
    'walk-in': '🚶',
    'phone': '📞',
    'online': '💻',
    'app': '📱',
  };

  return (
    <motion.div
      ref={(node: HTMLDivElement | null) => { drag(node); }}
      whileHover={{ scale: 1.01 }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing border-l-4 ${statusColors[guest.status]}`}
    >
      <Card className="p-3 bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {guest.vip && (
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
              <h4 className="text-slate-100 truncate">{guest.name}</h4>
              <span className="text-sm">{sourceIcons[guest.source]}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{guest.partySize}</span>
              </div>
              {guest.reservationTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(guest.reservationTime)}</span>
                </div>
              )}
              {guest.waitTime && (
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  <span>{guest.waitTime}m</span>
                </div>
              )}
              {guest.visitCount !== undefined && guest.visitCount > 5 && (
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  {guest.visitCount} visits
                </Badge>
              )}
            </div>
            {!compact && guest.specialRequests && (
              <p className="text-xs text-amber-400 mt-1 truncate">{guest.specialRequests}</p>
            )}
          </div>
          {guest.tableNumber && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0">
              T{guest.tableNumber}
            </Badge>
          )}
          {guest.estimatedWait && !guest.tableNumber && (
            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 flex-shrink-0 text-xs">
              ~{guest.estimatedWait}m
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

interface DroppableTableProps {
  table: Table;
  onDrop: (guest: Guest) => void;
  onClick: () => void;
  showServerSections: boolean;
  serverColor?: string;
}

function DroppableTable({ table, onDrop, onClick, showServerSections, serverColor }: DroppableTableProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'GUEST',
    drop: (item: { guest: Guest }) => onDrop(item.guest),
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const statusColors = {
    available: 'from-green-500 to-emerald-500',
    occupied: 'from-red-500 to-rose-500',
    reserved: 'from-blue-500 to-cyan-500',
    cleaning: 'from-slate-500 to-slate-600',
  };

  const shapeClasses = {
    round: 'rounded-full',
    square: 'rounded-xl',
    rectangle: 'rounded-xl',
  };

  const sizeClasses = {
    round: table.capacity <= 2 ? 'w-16 h-16' : table.capacity <= 4 ? 'w-20 h-20' : 'w-24 h-24',
    square: table.capacity <= 2 ? 'w-14 h-14' : table.capacity <= 4 ? 'w-18 h-18' : 'w-22 h-22',
    rectangle: table.capacity <= 2 ? 'w-20 h-14' : table.capacity <= 4 ? 'w-28 h-16' : 'w-32 h-20',
  };

  const serverColors: Record<string, string> = {
    blue: 'ring-blue-500',
    purple: 'ring-purple-500',
    green: 'ring-green-500',
    amber: 'ring-amber-500',
    rose: 'ring-rose-500',
  };

  return (
    <motion.div
      ref={(node: HTMLDivElement | null) => { drop(node); }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'absolute',
        left: table.position.x,
        top: table.position.y,
      }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div
        className={`
          ${sizeClasses[table.shape]} 
          ${shapeClasses[table.shape]} 
          bg-gradient-to-br ${statusColors[table.status]}
          ${isOver ? 'ring-4 ring-yellow-400' : ''}
          ${showServerSections && serverColor ? `ring-2 ${serverColors[serverColor]}` : ''}
          shadow-lg flex flex-col items-center justify-center text-white relative
          transition-all duration-200
        `}
      >
        <div className="text-xl">{table.number}</div>
        <div className="text-xs opacity-80">{table.capacity}</div>
        {isOver && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
            <Plus className="w-4 h-4 text-slate-900" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export function HostStationEnhanced() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'floor' | 'list' | 'timeline'>('floor');
  const [showServerSections, setShowServerSections] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftOverview, setShowShiftOverview] = useState(false);
  const [showGuestbook, setShowGuestbook] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [serverSections] = useState<ServerSection[]>(mockServerSections);
  const [shiftNotes] = useState<ShiftNote[]>(mockShiftNotes);

  useEffect(() => {
    setGuests(generateMockGuests());
    setTables(generateMockTables());
  }, []);

  const handleSeatGuest = (guest: Guest, table: Table) => {
    if (table.status !== 'available') {
      toast.error(`Table ${table.number} is not available`);
      return;
    }

    setGuests(guests.map(g =>
      g.id === guest.id
        ? { ...g, status: 'seated', tableNumber: table.number, seatedTime: new Date().toISOString() }
        : g
    ));
    setTables(tables.map(t =>
      t.id === table.id
        ? { ...t, status: 'occupied', currentGuest: guest.name }
        : t
    ));
    toast.success(`${guest.name} seated at Table ${table.number}`);
  };

  const handleClearTable = (table: Table) => {
    setTables(tables.map(t =>
      t.id === table.id
        ? { ...t, status: 'cleaning', currentGuest: undefined }
        : t
    ));
    setGuests(guests.map(g =>
      g.tableNumber === table.number
        ? { ...g, status: 'completed', tableNumber: undefined }
        : g
    ));
    toast.success(`Table ${table.number} marked for cleaning`);
    
    // Auto-set to available after 2 seconds
    setTimeout(() => {
      setTables(prev => prev.map(t =>
        t.id === table.id ? { ...t, status: 'available' } : t
      ));
      toast.success(`Table ${table.number} is now available`);
    }, 2000);
  };

  const waitingGuests = guests.filter(g => g.status === 'waiting');
  const reservedGuests = guests.filter(g => g.status === 'reserved');
  const seatedGuests = guests.filter(g => g.status === 'seated');
  const availableTables = tables.filter(t => t.status === 'available').length;
  const problemReservations = reservedGuests.filter(g => 
    g.reservationTime && new Date(g.reservationTime) < new Date()
  );

  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         g.phone.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || g.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Statistics for Shift Overview
  const shiftStats = {
    totalCovers: seatedGuests.reduce((sum, g) => sum + g.partySize, 0) + 
                 reservedGuests.reduce((sum, g) => sum + g.partySize, 0),
    seatedCovers: seatedGuests.reduce((sum, g) => sum + g.partySize, 0),
    reservedCovers: reservedGuests.reduce((sum, g) => sum + g.partySize, 0),
    waitlistCovers: waitingGuests.reduce((sum, g) => sum + g.partySize, 0),
    avgPartySize: guests.length > 0 
      ? (guests.reduce((sum, g) => sum + g.partySize, 0) / guests.length).toFixed(1)
      : '0',
    sourceBreakdown: {
      walkIn: guests.filter(g => g.source === 'walk-in').length,
      phone: guests.filter(g => g.source === 'phone').length,
      online: guests.filter(g => g.source === 'online').length,
      app: guests.filter(g => g.source === 'app').length,
    },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-900">
        {/* Top Menu Bar */}
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Quick Stats */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Notifications</span>
                  {problemReservations.length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center">
                      {problemReservations.length}
                    </Badge>
                  )}
                </Button>

                <Separator orientation="vertical" className="h-6 bg-slate-600" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  onClick={() => {
                    const problems = problemReservations.map(g => g.name).join(', ');
                    toast.error(`Late arrivals: ${problems || 'None'}`);
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                  <span className="hidden md:inline">Problems</span>
                  <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30">
                    {problemReservations.length}
                  </Badge>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  onClick={() => toast.info(`${waitingGuests.length} parties waiting`)}
                >
                  <Users className="w-4 h-4 mr-2 text-yellow-400" />
                  <span className="hidden md:inline">Waitlist</span>
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {waitingGuests.length}
                  </Badge>
                </Button>
              </div>

              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'floor' | 'list' | 'timeline')} className="w-auto">
                <TabsList className="bg-slate-700/50">
                  <TabsTrigger value="floor" className="data-[state=active]:bg-slate-600">
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Floor Plan
                  </TabsTrigger>
                  <TabsTrigger value="list" className="data-[state=active]:bg-slate-600">
                    <List className="w-4 h-4 mr-2" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600"
                  onClick={() => setShowShiftOverview(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Shift</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600"
                  onClick={() => setShowGuestbook(true)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Guests</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600"
                  onClick={() => setShowSettings(true)}
                >
                  <SettingsIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Reservations & Waitlist */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              {/* Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="seated">Seated</SelectItem>
                </SelectContent>
              </Select>

              {/* Guest Lists */}
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4">
                  {/* Waitlist */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-slate-400 uppercase tracking-wide">Waitlist</h3>
                      <Badge variant="secondary">{waitingGuests.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {filteredGuests.filter(g => g.status === 'waiting').map(guest => (
                        <DraggableGuestCard
                          key={guest.id}
                          guest={guest}
                          onClick={() => setSelectedGuest(guest)}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Reservations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-slate-400 uppercase tracking-wide">Reservations</h3>
                      <Badge variant="secondary">{reservedGuests.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {filteredGuests.filter(g => g.status === 'reserved').map(guest => (
                        <DraggableGuestCard
                          key={guest.id}
                          guest={guest}
                          onClick={() => setSelectedGuest(guest)}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Seated */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-slate-400 uppercase tracking-wide">Seated</h3>
                      <Badge variant="secondary">{seatedGuests.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {filteredGuests.filter(g => g.status === 'seated').map(guest => (
                        <DraggableGuestCard
                          key={guest.id}
                          guest={guest}
                          onClick={() => setSelectedGuest(guest)}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-9">
              {/* Floor Plan View */}
              {viewMode === 'floor' && (
                <Card className="p-6 bg-slate-800/50 border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl text-slate-100 mb-1">Floor Plan</h2>
                      <p className="text-sm text-slate-400">Drag guests to tables to seat them</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          // AI Seating Optimization logic
                          const waitingVIPs = waitingGuests.filter(g => g.vip);
                          const regularWaiting = waitingGuests.filter(g => !g.vip);
                          const availables = tables.filter(t => t.status === 'available');
                          
                          if (waitingGuests.length === 0) {
                            toast.info('No guests waiting to be seated');
                            return;
                          }
                          
                          if (availables.length === 0) {
                            toast.error('No available tables');
                            return;
                          }

                          // AI suggestion: Prioritize VIPs, match party sizes
                          const suggestions: string[] = [];
                          [...waitingVIPs, ...regularWaiting].forEach(guest => {
                            const bestTable = availables.find(t => 
                              t.capacity >= guest.partySize && 
                              t.capacity <= guest.partySize + 2
                            );
                            if (bestTable) {
                              suggestions.push(`${guest.name} → Table ${bestTable.number}`);
                            }
                          });

                          if (suggestions.length > 0) {
                            toast.success(
                              <div>
                                <p className="font-bold mb-1">✨ AI Seating Suggestions:</p>
                                {suggestions.slice(0, 3).map((s, i) => (
                                  <p key={i} className="text-sm">{s}</p>
                                ))}
                              </div>,
                              { duration: 5000 }
                            );
                          } else {
                            toast.info('No optimal seating matches found');
                          }
                        }}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Optimize
                      </Button>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={showServerSections}
                          onCheckedChange={setShowServerSections}
                          id="server-sections"
                        />
                        <Label htmlFor="server-sections" className="text-sm text-slate-300">
                          Server Sections
                        </Label>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {availableTables} Available
                      </Badge>
                    </div>
                  </div>

                  {/* Floor Plan Canvas */}
                  <div className="relative bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-700 min-h-[600px] overflow-auto">
                    {tables.map(table => {
                      const serverSection = serverSections.find(s => s.tables.includes(table.number));
                      return (
                        <DroppableTable
                          key={table.id}
                          table={table}
                          onDrop={(guest) => handleSeatGuest(guest, table)}
                          onClick={() => setSelectedTable(table)}
                          showServerSections={showServerSections}
                          serverColor={serverSection?.color}
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-500" />
                      <span className="text-slate-400">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-rose-500" />
                      <span className="text-slate-400">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-cyan-500" />
                      <span className="text-slate-400">Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-500 to-slate-600" />
                      <span className="text-slate-400">Cleaning</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <Card className="p-6 bg-slate-800/50 border-slate-700">
                  <h2 className="text-xl text-slate-100 mb-4">All Guests - List View</h2>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredGuests.map(guest => (
                        <DraggableGuestCard
                          key={guest.id}
                          guest={guest}
                          onClick={() => setSelectedGuest(guest)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <Card className="p-6 bg-slate-800/50 border-slate-700">
                  <h2 className="text-xl text-slate-100 mb-4">Reservation Timeline</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-24 gap-px bg-slate-700 rounded overflow-hidden">
                      {/* Hour headers */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = 17 + i; // 5 PM to 4 AM
                        const displayHour = hour > 12 ? hour - 12 : hour;
                        const ampm = hour >= 24 ? 'AM' : hour >= 12 ? 'PM' : 'AM';
                        return (
                          <div key={i} className="col-span-2 bg-slate-800 p-2 text-center">
                            <div className="text-xs text-slate-400">{displayHour}{ampm}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline slots */}
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {reservedGuests.map(guest => {
                          const resTime = guest.reservationTime ? new Date(guest.reservationTime) : new Date();
                          
                          return (
                            <div key={guest.id} className="relative">
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-slate-400">
                                  {resTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </div>
                                <div className="flex-1">
                                  <DraggableGuestCard guest={guest} onClick={() => setSelectedGuest(guest)} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Guest Detail Dialog */}
        <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedGuest?.vip && <Sparkles className="w-5 h-5 text-amber-400" />}
                {selectedGuest?.name}
                <Badge className={
                  selectedGuest?.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedGuest?.status === 'reserved' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }>
                  {selectedGuest?.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Guest profile and reservation details
              </DialogDescription>
            </DialogHeader>

            {selectedGuest && (
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-200">{selectedGuest.phone}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-200 text-sm">{selectedGuest.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Party Size</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-200">{selectedGuest.partySize} guests</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Source</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">
                        {selectedGuest.source === 'walk-in' ? '🚶' :
                         selectedGuest.source === 'phone' ? '📞' :
                         selectedGuest.source === 'online' ? '💻' : '📱'}
                      </span>
                      <span className="text-slate-200 capitalize">{selectedGuest.source}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                {/* Preferences */}
                {selectedGuest.preferences && (
                  <>
                    <div>
                      <Label className="text-slate-400 text-xs mb-2 block">Preferences</Label>
                      <div className="space-y-2">
                        {selectedGuest.preferences.seating && selectedGuest.preferences.seating.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            {selectedGuest.preferences.seating.map((pref, i) => (
                              <Badge key={i} variant="secondary" className="bg-blue-500/20 text-blue-400">
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {selectedGuest.preferences.dietary && selectedGuest.preferences.dietary.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Utensils className="w-4 h-4 text-green-400" />
                            {selectedGuest.preferences.dietary.map((pref, i) => (
                              <Badge key={i} variant="secondary" className="bg-green-500/20 text-green-400">
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}

                {/* Special Requests */}
                {selectedGuest.specialRequests && (
                  <>
                    <div>
                      <Label className="text-slate-400 text-xs mb-2 block">Special Requests</Label>
                      <p className="text-slate-200 bg-slate-900/50 p-3 rounded">
                        {selectedGuest.specialRequests}
                      </p>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}

                {/* Visit History */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded">
                  <div className="text-center">
                    <div className="text-2xl text-blue-400">{selectedGuest.visitCount || 0}</div>
                    <div className="text-xs text-slate-400">Total Visits</div>
                  </div>
                  {selectedGuest.tableNumber && (
                    <div className="text-center">
                      <div className="text-2xl text-green-400">T{selectedGuest.tableNumber}</div>
                      <div className="text-xs text-slate-400">Current Table</div>
                    </div>
                  )}
                  {selectedGuest.serverName && (
                    <div className="text-center">
                      <div className="text-2xl text-purple-400">{selectedGuest.serverName}</div>
                      <div className="text-xs text-slate-400">Server</div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Guest
                  </Button>
                  <Button variant="outline" className="flex-1 border-slate-600">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Table Detail Dialog */}
        <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
            <DialogHeader>
              <DialogTitle>Table {selectedTable?.number}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Capacity: {selectedTable?.capacity} guests • Section: {selectedTable?.section}
              </DialogDescription>
            </DialogHeader>

            {selectedTable && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Status</div>
                    <Badge className={
                      selectedTable.status === 'available' ? 'bg-green-500/20 text-green-400' :
                      selectedTable.status === 'occupied' ? 'bg-red-500/20 text-red-400' :
                      selectedTable.status === 'reserved' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }>
                      {selectedTable.status}
                    </Badge>
                  </div>
                  {selectedTable.serverName && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Server</div>
                      <div className="text-slate-200">{selectedTable.serverName}</div>
                    </div>
                  )}
                </div>

                {selectedTable.currentGuest && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded">
                    <div className="text-sm text-slate-400 mb-1">Current Guest</div>
                    <div className="text-slate-100">{selectedTable.currentGuest}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedTable.status === 'occupied' && (
                    <Button
                      onClick={() => {
                        handleClearTable(selectedTable);
                        setSelectedTable(null);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Clear Table
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTable(null)}
                    className="flex-1 border-slate-600"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Shift Overview Dialog */}
        <Dialog open={showShiftOverview} onOpenChange={setShowShiftOverview}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-3xl">
            <DialogHeader>
              <DialogTitle>Shift Overview</DialogTitle>
              <DialogDescription className="text-slate-400">
                Current shift statistics and notes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Cover Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900/50 border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Total Covers</div>
                  <div className="text-2xl text-blue-400">{shiftStats.totalCovers}</div>
                </Card>
                <Card className="p-4 bg-slate-900/50 border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Seated</div>
                  <div className="text-2xl text-green-400">{shiftStats.seatedCovers}</div>
                </Card>
                <Card className="p-4 bg-slate-900/50 border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Reserved</div>
                  <div className="text-2xl text-blue-400">{shiftStats.reservedCovers}</div>
                </Card>
                <Card className="p-4 bg-slate-900/50 border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Avg Party</div>
                  <div className="text-2xl text-purple-400">{shiftStats.avgPartySize}</div>
                </Card>
              </div>

              {/* Source Breakdown */}
              <div>
                <h3 className="text-sm text-slate-400 mb-3">Covers by Source</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-900/50 rounded text-center">
                    <div className="text-lg mb-1">🚶</div>
                    <div className="text-xl text-slate-100">{shiftStats.sourceBreakdown.walkIn}</div>
                    <div className="text-xs text-slate-400">Walk-in</div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded text-center">
                    <div className="text-lg mb-1">📞</div>
                    <div className="text-xl text-slate-100">{shiftStats.sourceBreakdown.phone}</div>
                    <div className="text-xs text-slate-400">Phone</div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded text-center">
                    <div className="text-lg mb-1">💻</div>
                    <div className="text-xl text-slate-100">{shiftStats.sourceBreakdown.online}</div>
                    <div className="text-xs text-slate-400">Online</div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded text-center">
                    <div className="text-lg mb-1">📱</div>
                    <div className="text-xl text-slate-100">{shiftStats.sourceBreakdown.app}</div>
                    <div className="text-xs text-slate-400">App</div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Shift Notes */}
              <div>
                <h3 className="text-sm text-slate-400 mb-3">Shift Notes</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {shiftNotes.map(note => (
                      <Card key={note.id} className="p-3 bg-slate-900/50 border-slate-700">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            note.type === 'menu' ? 'bg-red-400' :
                            note.type === 'reservation' ? 'bg-blue-400' :
                            note.type === 'staff' ? 'bg-green-400' :
                            'bg-slate-400'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {note.type}
                              </Badge>
                              <span className="text-xs text-slate-500">{note.author}</span>
                            </div>
                            <p className="text-sm text-slate-200">{note.message}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Guestbook Dialog */}
        <Dialog open={showGuestbook} onOpenChange={setShowGuestbook}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-4xl">
            <DialogHeader>
              <DialogTitle>Guestbook</DialogTitle>
              <DialogDescription className="text-slate-400">
                Guest profiles and preferences
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Search guests..."
                className="bg-slate-900 border-slate-700 text-slate-100"
              />
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {guests.map(guest => (
                    <Card
                      key={guest.id}
                      className="p-4 bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setShowGuestbook(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {guest.vip && <Sparkles className="w-4 h-4 text-amber-400" />}
                            <h4 className="text-slate-100">{guest.name}</h4>
                            {guest.visitCount !== undefined && guest.visitCount > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                {guest.visitCount} visits
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-slate-400">
                            <div>{guest.phone}</div>
                            {guest.preferences?.seating && guest.preferences.seating.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <MapPin className="w-3 h-3" />
                                {guest.preferences.seating.map((pref, i) => (
                                  <span key={i} className="text-xs text-blue-400">{pref}</span>
                                ))}
                              </div>
                            )}
                            {guest.preferences?.dietary && guest.preferences.dietary.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <Utensils className="w-3 h-3" />
                                {guest.preferences.dietary.map((pref, i) => (
                                  <span key={i} className="text-xs text-green-400">{pref}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure app preferences
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Always Show Server Sections</Label>
                    <p className="text-xs text-slate-400">Display server assignments on floor plan</p>
                  </div>
                  <Switch checked={showServerSections} onCheckedChange={setShowServerSections} />
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Auto-notify Waitlist</Label>
                    <p className="text-xs text-slate-400">Send SMS when table is ready</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Require User Logging</Label>
                    <p className="text-xs text-slate-400">Log user name for reservation changes</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div>
                <Label className="text-slate-200 mb-2 block">Default Wait Time Estimate</Label>
                <Select defaultValue="20">
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notifications Panel */}
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {problemReservations.length > 0 ? (
                  problemReservations.map(guest => (
                    <Card key={guest.id} className="p-3 bg-red-500/10 border-red-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-slate-100 mb-1">{guest.name} - Late Arrival</h4>
                          <p className="text-sm text-slate-400">
                            Reserved for {guest.reservationTime && new Date(guest.reservationTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
