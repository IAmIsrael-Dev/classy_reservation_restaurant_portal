import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Award,
  Download,
  Filter,
  RefreshCw,
  Star,
  Utensils,
  Target,
  Eye,
  CheckCircle2,
  LayoutGrid,
  Plus,
  Save,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Settings,
  Home,
  FileText,
  Image,
  Tag,
  Square,
  Circle,
  RectangleHorizontal,
  Diamond,
  Hexagon,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCw,
  UserCheck,
  List,
  Timer,
  Bell,
  ShoppingBag,
  Package,
  Truck,
  X,
  Copy,
  Check,
  CalendarDays,
  UserPlus,
  Columns,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ReservationKanbanView } from "./reservation-kanban-view";

// ===== TYPES =====
type TableShape =
  | "round"
  | "square"
  | "rectangular"
  | "diamond"
  | "oval"
  | "hexagon"
  | "booth"
  | "bar"
  | "banquet"
  | "semicircle"
  | "triangle"
  | "octagon"
  | "communal"
  | "high-top"
  | "booth-curved"
  | "u-shape"
  | "l-shape";
type TableStatus = "available" | "reserved" | "occupied";
type ReservationStatus = "waiting" | "seated" | "completed";
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

interface Position {
  x: number;
  y: number;
}

interface FloorTable {
  id: string;
  number: number;
  floorId: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  position: Position;
  rotation?: number;
  scale?: number; // Size multiplier (default 1.0)
  reservationId?: string;
  serverId?: string;
}

interface Floor {
  id: string;
  name: string;
  tableCount: number;
  layout: FloorTable[];
  lastModified?: string;
}

interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  tableId?: string;
  notes?: string;
  vip?: boolean;
}

interface WaitlistGuest {
  id: string;
  guestName: string;
  partySize: number;
  phone: string;
  addedAt: string;
  estimatedWait: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  popular?: boolean;
  dietary?: string[];
  image?: string;
  available?: boolean;
  takeoutAvailable?: boolean;
}

interface TakeoutOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  orderTime: string;
  pickupTime: string;
  notes?: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface HoursOfOperation {
  day: DayOfWeek;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// ===== MOCK DATA =====
const revenueData = [
  {
    month: "Jan",
    revenue: 45000,
    reservations: 234,
    takeout: 8900,
  },
  {
    month: "Feb",
    revenue: 52000,
    reservations: 267,
    takeout: 10200,
  },
  {
    month: "Mar",
    revenue: 48000,
    reservations: 245,
    takeout: 9500,
  },
  {
    month: "Apr",
    revenue: 61000,
    reservations: 312,
    takeout: 12100,
  },
  {
    month: "May",
    revenue: 55000,
    reservations: 289,
    takeout: 11200,
  },
  {
    month: "Jun",
    revenue: 67000,
    reservations: 345,
    takeout: 13400,
  },
  {
    month: "Jul",
    revenue: 72000,
    reservations: 378,
    takeout: 14800,
  },
  {
    month: "Aug",
    revenue: 68000,
    reservations: 356,
    takeout: 13900,
  },
  {
    month: "Sep",
    revenue: 74000,
    reservations: 391,
    takeout: 15300,
  },
  {
    month: "Oct",
    revenue: 71000,
    reservations: 367,
    takeout: 14600,
  },
];

const reservationSources = [
  { name: "Online", value: 45, color: "#3b82f6" },
  { name: "Phone", value: 25, color: "#06b6d4" },
  { name: "Walk-in", value: 20, color: "#8b5cf6" },
  { name: "App", value: 10, color: "#10b981" },
];

const popularTimes = [
  { hour: "5 PM", bookings: 12 },
  { hour: "6 PM", bookings: 28 },
  { hour: "7 PM", bookings: 45 },
  { hour: "8 PM", bookings: 52 },
  { hour: "9 PM", bookings: 38 },
  { hour: "10 PM", bookings: 22 },
];

const topDishes = [
  { name: "Grilled Salmon", orders: 156, revenue: 3900 },
  { name: "Ribeye Steak", orders: 134, revenue: 5360 },
  { name: "Pasta Carbonara", orders: 128, revenue: 2560 },
  { name: "Caesar Salad", orders: 98, revenue: 1470 },
  { name: "Lobster Risotto", orders: 87, revenue: 3480 },
];

const recentReservations: Reservation[] = [
  {
    id: "res-1",
    guestName: "Sarah Johnson",
    phone: "(555) 123-4567",
    email: "sarah@email.com",
    time: "2025-10-21T17:00:00Z",
    partySize: 2,
    status: "seated",
    tableId: "t-1",
    vip: true,
    notes: "Window seat preferred",
  },
  {
    id: "res-2",
    guestName: "Michael Chen",
    phone: "(555) 234-5678",
    email: "michael@email.com",
    time: "2025-10-21T17:30:00Z",
    partySize: 4,
    status: "waiting",
    notes: "Birthday celebration",
  },
  {
    id: "res-3",
    guestName: "Emma Davis",
    phone: "(555) 345-6789",
    email: "emma@email.com",
    time: "2025-10-21T18:00:00Z",
    partySize: 4,
    status: "seated",
    tableId: "t-5",
  },
  {
    id: "res-4",
    guestName: "David Martinez",
    phone: "(555) 456-7890",
    email: "david@email.com",
    time: "2025-10-21T18:30:00Z",
    partySize: 6,
    status: "waiting",
    vip: true,
  },
  {
    id: "res-5",
    guestName: "Lisa Anderson",
    phone: "(555) 567-8901",
    email: "lisa@email.com",
    time: "2025-10-21T19:00:00Z",
    partySize: 2,
    status: "waiting",
  },
  {
    id: "res-6",
    guestName: "Robert Taylor",
    phone: "(555) 678-9012",
    email: "robert@email.com",
    time: "2025-10-21T19:30:00Z",
    partySize: 3,
    status: "waiting",
  },
  {
    id: "res-7",
    guestName: "Jennifer White",
    phone: "(555) 789-0123",
    email: "jennifer@email.com",
    time: "2025-10-21T20:00:00Z",
    partySize: 5,
    status: "waiting",
    notes: "Anniversary dinner",
  },
  {
    id: "res-8",
    guestName: "James Brown",
    phone: "(555) 890-1234",
    email: "james@email.com",
    time: "2025-10-21T20:30:00Z",
    partySize: 2,
    status: "waiting",
    vip: true,
  },
];

const mockWaitlist: WaitlistGuest[] = [
  {
    id: "wait-1",
    guestName: "John Smith",
    partySize: 2,
    phone: "(555) 789-0123",
    addedAt: "2025-10-21T18:45:00Z",
    estimatedWait: 15,
  },
  {
    id: "wait-2",
    guestName: "Jane Doe",
    partySize: 4,
    phone: "(555) 890-1234",
    addedAt: "2025-10-21T18:50:00Z",
    estimatedWait: 25,
  },
  {
    id: "wait-3",
    guestName: "Robert Wilson",
    partySize: 3,
    phone: "(555) 901-2345",
    addedAt: "2025-10-21T18:55:00Z",
    estimatedWait: 35,
  },
];

const mockFloors: Floor[] = [
  {
    id: "floor-1",
    name: "Ground Floor",
    tableCount: 12,
    lastModified: "2025-10-21T10:30:00Z",
    layout: [
      // Row 1 - Centered at y: 150
      {
        id: "t-1",
        number: 1,
        floorId: "floor-1",
        capacity: 2,
        shape: "round",
        status: "occupied",
        position: { x: 180, y: 150 },
        rotation: 0,
        reservationId: "res-1",
      },
      {
        id: "t-2",
        number: 2,
        floorId: "floor-1",
        capacity: 4,
        shape: "square",
        status: "available",
        position: { x: 340, y: 150 },
        rotation: 0,
      },
      {
        id: "t-3",
        number: 3,
        floorId: "floor-1",
        capacity: 4,
        shape: "square",
        status: "reserved",
        position: { x: 500, y: 150 },
        rotation: 0,
        reservationId: "res-2",
      },
      // Row 2 - Centered at y: 300
      {
        id: "t-4",
        number: 4,
        floorId: "floor-1",
        capacity: 6,
        shape: "rectangular",
        status: "available",
        position: { x: 180, y: 300 },
        rotation: 0,
      },
      {
        id: "t-5",
        number: 5,
        floorId: "floor-1",
        capacity: 4,
        shape: "square",
        status: "occupied",
        position: { x: 340, y: 300 },
        rotation: 0,
        reservationId: "res-3",
      },
      {
        id: "t-6",
        number: 6,
        floorId: "floor-1",
        capacity: 2,
        shape: "round",
        status: "available",
        position: { x: 500, y: 300 },
        rotation: 0,
      },
    ],
  },
  {
    id: "floor-2",
    name: "First Floor",
    tableCount: 8,
    lastModified: "2025-10-20T15:45:00Z",
    layout: [
      // Centered layout for First Floor
      {
        id: "t-7",
        number: 7,
        floorId: "floor-2",
        capacity: 4,
        shape: "square",
        status: "available",
        position: { x: 260, y: 225 },
        rotation: 0,
      },
      {
        id: "t-8",
        number: 8,
        floorId: "floor-2",
        capacity: 6,
        shape: "rectangular",
        status: "reserved",
        position: { x: 440, y: 225 },
        rotation: 0,
        reservationId: "res-4",
      },
    ],
  },
];

const mockMenu: MenuItem[] = [
  {
    id: "m-1",
    name: "Grilled Salmon",
    description:
      "Fresh Atlantic salmon with seasonal vegetables",
    price: 28,
    category: "Entrees",
    popular: true,
    dietary: ["Gluten-Free"],
    available: true,
    takeoutAvailable: true,
  },
  {
    id: "m-2",
    name: "Ribeye Steak",
    description: "12oz USDA Prime ribeye with garlic butter",
    price: 42,
    category: "Entrees",
    popular: true,
    available: true,
    takeoutAvailable: false,
  },
  {
    id: "m-3",
    name: "Pasta Carbonara",
    description: "Traditional Roman-style carbonara",
    price: 22,
    category: "Entrees",
    available: true,
    takeoutAvailable: true,
  },
  {
    id: "m-4",
    name: "Caesar Salad",
    description:
      "Romaine, parmesan, croutons, house-made dressing",
    price: 14,
    category: "Starters",
    dietary: ["Vegetarian"],
    available: true,
    takeoutAvailable: true,
  },
  {
    id: "m-5",
    name: "Lobster Risotto",
    description: "Creamy arborio rice with fresh lobster",
    price: 38,
    category: "Entrees",
    popular: true,
    dietary: ["Gluten-Free"],
    available: true,
    takeoutAvailable: true,
  },
  {
    id: "m-6",
    name: "Bruschetta",
    description:
      "Toasted bread with tomatoes, basil, and olive oil",
    price: 12,
    category: "Starters",
    dietary: ["Vegetarian", "Vegan"],
    available: true,
    takeoutAvailable: true,
  },
];

const mockTakeoutOrders: TakeoutOrder[] = [
  {
    id: "to-1",
    orderNumber: "TO-1001",
    customerName: "Jennifer Williams",
    phone: "(555) 111-2222",
    email: "jennifer@email.com",
    items: [
      {
        menuItemId: "m-1",
        name: "Grilled Salmon",
        quantity: 2,
        price: 28,
      },
      {
        menuItemId: "m-4",
        name: "Caesar Salad",
        quantity: 1,
        price: 14,
      },
    ],
    total: 70,
    status: "preparing",
    orderTime: "2025-10-21T18:30:00Z",
    pickupTime: "2025-10-21T19:15:00Z",
  },
  {
    id: "to-2",
    orderNumber: "TO-1002",
    customerName: "Mark Thompson",
    phone: "(555) 333-4444",
    email: "mark@email.com",
    items: [
      {
        menuItemId: "m-3",
        name: "Pasta Carbonara",
        quantity: 3,
        price: 22,
      },
    ],
    total: 66,
    status: "ready",
    orderTime: "2025-10-21T18:45:00Z",
    pickupTime: "2025-10-21T19:30:00Z",
  },
  {
    id: "to-3",
    orderNumber: "TO-1003",
    customerName: "Rachel Green",
    phone: "(555) 555-6666",
    email: "rachel@email.com",
    items: [
      {
        menuItemId: "m-5",
        name: "Lobster Risotto",
        quantity: 1,
        price: 38,
      },
      {
        menuItemId: "m-4",
        name: "Caesar Salad",
        quantity: 2,
        price: 14,
      },
    ],
    total: 66,
    status: "pending",
    orderTime: "2025-10-21T19:00:00Z",
    pickupTime: "2025-10-21T19:45:00Z",
  },
];


const defaultHours: HoursOfOperation[] = [
  {
    day: "monday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "22:00",
  },
  {
    day: "tuesday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "22:00",
  },
  {
    day: "wednesday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "22:00",
  },
  {
    day: "thursday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "22:00",
  },
  {
    day: "friday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "23:00",
  },
  {
    day: "saturday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "23:00",
  },
  {
    day: "sunday",
    isOpen: true,
    openTime: "17:00",
    closeTime: "21:00",
  },
];

// ===== TABLE COMPONENT FOR FLOOR PLAN =====
interface TableComponentProps {
  table: FloorTable;
  onClick: () => void;
  onDrop?: (tableId: string, x: number, y: number) => void;
  scale?: number;
  selectedId?: string;
  isEditMode?: boolean;
}

function TableComponent({
  table,
  onClick,
  selectedId,
  isEditMode = false,
}: TableComponentProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "table",
      item: {
        id: table.id,
        x: table.position.x,
        y: table.position.y,
      },
      canDrag: isEditMode,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [table.id, table.position, isEditMode],
  );

  // Professional color system - Green (Available), Orange (Occupied), Blue/Gray (Reserved)
  const statusStyles = {
    available: {
      bg: "bg-gradient-to-br from-emerald-500/90 to-emerald-600/90",
      border: "border-emerald-400/50",
      shadow: "shadow-lg shadow-emerald-900/20",
      hoverBg: "hover:from-emerald-500 hover:to-emerald-600",
      text: "text-white",
      indicator: "bg-emerald-300",
      indicatorRing: "ring-emerald-400/40",
    },
    reserved: {
      bg: "bg-gradient-to-br from-slate-600/90 to-slate-700/90",
      border: "border-slate-500/50",
      shadow: "shadow-lg shadow-slate-900/30",
      hoverBg: "hover:from-slate-600 hover:to-slate-700",
      text: "text-slate-100",
      indicator: "bg-blue-400",
      indicatorRing: "ring-blue-400/40",
    },
    occupied: {
      bg: "bg-gradient-to-br from-orange-500/90 to-orange-600/90",
      border: "border-orange-400/50",
      shadow: "shadow-lg shadow-orange-900/20",
      hoverBg: "hover:from-orange-500 hover:to-orange-600",
      text: "text-white",
      indicator: "bg-orange-300",
      indicatorRing: "ring-orange-400/40",
    },
  };

  const shapeClasses = {
    round: "rounded-full",
    square: "rounded-2xl",
    rectangular: "rounded-2xl",
    diamond: "rounded-2xl",
    oval: "rounded-full",
    hexagon: "rounded-2xl",
    booth: "rounded-3xl",
    bar: "rounded-xl",
    banquet: "rounded-2xl",
    semicircle: "rounded-t-full rounded-b-md",
    triangle: "rounded-2xl",
    octagon: "rounded-3xl",
    communal: "rounded-2xl",
    "high-top": "rounded-2xl",
    "booth-curved": "rounded-[2rem]",
    "u-shape": "rounded-2xl",
    "l-shape": "rounded-2xl",
  };

  const sizeMap = {
    2: { width: 70, height: 70 },
    4: { width: 90, height: 90 },
    6: { width: 130, height: 90 },
    8: { width: 150, height: 100 },
  };

  // Adjust size based on shape
  let size =
    sizeMap[table.capacity as keyof typeof sizeMap] ||
    sizeMap[4];

  // Special sizing for specific shapes
  if (table.shape === "rectangular") {
    size = {
      width: size.width * 1.5,
      height: size.height * 0.8,
    }; // Long rectangular
  } else if (table.shape === "oval") {
    size = {
      width: size.width * 1.3,
      height: size.height * 0.9,
    }; // Elongated oval
  } else if (table.shape === "diamond") {
    size = {
      width: size.width * 1.1,
      height: size.height * 1.1,
    }; // Slightly larger diamond
  } else if (table.shape === "hexagon") {
    size = {
      width: size.width * 1.2,
      height: size.height * 1.1,
    }; // Hexagonal shape
  } else if (table.shape === "booth") {
    size = {
      width: size.width * 1.3,
      height: size.height * 1.2,
    }; // Wider and taller
  } else if (table.shape === "bar") {
    size = {
      width: size.width * 1.8,
      height: size.height * 0.6,
    }; // Very wide, narrow
  } else if (table.shape === "banquet") {
    size = { width: size.width * 2, height: size.height * 0.8 }; // Long rectangular
  } else if (table.shape === "semicircle") {
    size = {
      width: size.width * 1.2,
      height: size.height * 0.8,
    }; // Wider, shorter
  } else if (table.shape === "triangle") {
    size = {
      width: size.width * 1.1,
      height: size.height * 1.1,
    }; // Slightly larger
  } else if (table.shape === "communal") {
    size = {
      width: size.width * 2.5,
      height: size.height * 1.2,
    }; // Very long, wider
  } else if (table.shape === "high-top") {
    size = {
      width: size.width * 0.8,
      height: size.height * 0.8,
    }; // Smaller
  } else if (table.shape === "booth-curved") {
    size = {
      width: size.width * 1.4,
      height: size.height * 1.3,
    }; // Curved booth
  } else if (table.shape === "u-shape") {
    size = {
      width: size.width * 1.6,
      height: size.height * 1.4,
    }; // U-shaped
  } else if (table.shape === "l-shape") {
    size = {
      width: size.width * 1.5,
      height: size.height * 1.3,
    }; // L-shaped
  }

  // Apply scale multiplier (default 1.0)
  const tableScale = table.scale || 1.0;
  size = {
    width: size.width * tableScale,
    height: size.height * tableScale,
  };

  const isSelected = selectedId === table.id;
  const currentStyle = statusStyles[table.status];

  return (
    <motion.div
      ref={(node: HTMLDivElement | null) => {
        if (isEditMode) {
          drag(node);
        }
      }}
      whileHover={{ scale: isEditMode ? 1.05 : 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
      animate={{
        rotate: table.rotation || 0,
      }}
      transition={{ duration: 0.2 }}
      className={`absolute cursor-pointer transition-all duration-200 ${shapeClasses[table.shape]} ${currentStyle.bg} ${currentStyle.border} ${currentStyle.shadow} ${currentStyle.hoverBg} ${currentStyle.text} border-2 flex flex-col items-center justify-center overflow-hidden ${
        isSelected
          ? "ring-4 ring-blue-400/60 scale-110 shadow-2xl"
          : ""
      } ${isDragging ? "opacity-50" : "opacity-100"} ${isEditMode ? "cursor-move" : ""}`}
      style={{
        left: `${table.position.x}px`,
        top: `${table.position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transformOrigin: "center center",
      }}
      onClick={onClick}
    >
      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* 3D depth effect - top highlight */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent rounded-[inherit]" />

        {/* Table content container */}
        <div className="relative z-10 flex flex-col items-center justify-center px-2">
          {/* Table number label */}
          <div className="text-base font-semibold tracking-tight drop-shadow-sm">
            T{table.number}
          </div>

          {/* Capacity badge */}
          <div className="mt-0.5 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm flex items-center gap-1">
            <Users className="w-3 h-3 opacity-80" />
            <span className="text-[10px] font-medium">
              {table.capacity}
            </span>
          </div>
        </div>

        {/* Status indicator ring (top-right corner) */}
        <div
          className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${currentStyle.indicator} ring-2 ${currentStyle.indicatorRing} shadow-sm`}
        />

        {/* Bottom shadow for depth */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/15 to-transparent rounded-[inherit]" />
      </div>
    </motion.div>
  );
}

// ===== DROPPABLE FLOOR CANVAS WITH PAN & ZOOM =====
interface DroppableCanvasProps {
  children: React.ReactNode;
  onDrop: (x: number, y: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
}

function DroppableCanvas({
  children,
  onDrop,
  scale,
  onScaleChange,
}: DroppableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<
    number | null
  >(null);

  const [, drop] = useDrop(() => ({
    accept: "table",
    drop: (
      item: { id: string; x: number; y: number },
      monitor,
    ) => {
      const offset = monitor.getClientOffset();
      if (offset && canvasRef.current) {
        const canvasRect =
          canvasRef.current.getBoundingClientRect();
        // Adjust for pan and scale
        const x = (offset.x - canvasRect.left - pan.x) / scale;
        const y = (offset.y - canvasRect.top - pan.y) / scale;
        onDrop(x, y);
      }
    },
  }));

  // Handle mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey) {
      // Middle click or Ctrl+click for pan
      setIsPanning(true);
      setStartPan({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle touch gestures (pan and pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Pan start
      setIsPanning(true);
      setStartPan({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const delta = distance - lastTouchDistance;

      // Apply zoom
      const zoomDelta = delta > 0 ? 0.02 : -0.02;
      const newScale = Math.max(
        0.3,
        Math.min(1.5, scale + zoomDelta),
      );
      onScaleChange(newScale);

      setLastTouchDistance(distance);
      e.preventDefault();
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      setPan({
        x: e.touches[0].clientX - startPan.x,
        y: e.touches[0].clientY - startPan.y,
      });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(
        0.3,
        Math.min(1.5, scale + zoomDelta),
      );
      onScaleChange(newScale);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{
        cursor: isPanning ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <div
        ref={(node: HTMLDivElement | null) => {
          canvasRef.current = node;
          drop(node);
        }}
        className="absolute"
        style={{
          width: "800px",
          height: "600px",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "center center",
          left: "50%",
          top: "50%",
          marginLeft: "-400px",
          marginTop: "-300px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ===== PANNABLE CANVAS FOR VIEW MODE =====
interface PannableCanvasProps {
  children: React.ReactNode;
  scale: number;
  onScaleChange: (scale: number) => void;
}

function PannableCanvas({
  children,
  scale,
  onScaleChange,
}: PannableCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<
    number | null
  >(null);

  // Handle mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey) {
      // Middle click or Ctrl+click for pan
      setIsPanning(true);
      setStartPan({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle touch gestures (pan and pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Pan start
      setIsPanning(true);
      setStartPan({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const delta = distance - lastTouchDistance;

      // Apply zoom
      const zoomDelta = delta > 0 ? 0.02 : -0.02;
      const newScale = Math.max(
        0.3,
        Math.min(1.5, scale + zoomDelta),
      );
      onScaleChange(newScale);

      setLastTouchDistance(distance);
      e.preventDefault();
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      setPan({
        x: e.touches[0].clientX - startPan.x,
        y: e.touches[0].clientY - startPan.y,
      });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(
        0.3,
        Math.min(1.5, scale + zoomDelta),
      );
      onScaleChange(newScale);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{
        cursor: isPanning ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <div
        className="absolute"
        style={{
          width: "800px",
          height: "600px",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "center center",
          left: "50%",
          top: "50%",
          marginLeft: "-400px",
          marginTop: "-300px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export function ManagerApp() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedFloor, setSelectedFloor] =
    useState<Floor | null>(mockFloors[0]);
  const [selectedTable, setSelectedTable] =
    useState<FloorTable | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTableDetailOpen, setIsTableDetailOpen] =
    useState(false);
  const [isFloorDialogOpen, setIsFloorDialogOpen] =
    useState(false);
  const [editingFloor, setEditingFloor] =
    useState<Floor | null>(null);
  const [floorName, setFloorName] = useState("");
  const [floors, setFloors] = useState<Floor[]>(mockFloors);
  const [reservations, setReservations] = useState<
    Reservation[]
  >(recentReservations);
  const [waitlist, setWaitlist] =
    useState<WaitlistGuest[]>(mockWaitlist);
  const [menu, setMenu] = useState<MenuItem[]>(mockMenu);
  const [takeoutOrders, setTakeoutOrders] = useState<
    TakeoutOrder[]
  >(mockTakeoutOrders);
  const [scale, setScale] = useState(0.7);
  const [hours, setHours] =
    useState<HoursOfOperation[]>(defaultHours);
  const [selectedMenuItem, setSelectedMenuItem] =
    useState<MenuItem | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] =
    useState(false);
  const [menuCategories] = useState([
    "Starters",
    "Entrees",
    "Desserts",
    "Beverages",
  ]);
  const [dineInView, setDineInView] = useState<
    "floor" | "list"
  >("floor");
  const selectedDate = new Date();
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | WaitlistGuest | null>(null);

  // Restaurant listing state
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "The Reserve",
    cuisine: "Modern American",
    description:
      "An elevated dining experience featuring locally-sourced ingredients and innovative cuisine.",
    address: "123 Main Street, Downtown",
    phone: "(555) 123-4567",
    email: "info@thereserve.com",
    priceLevel: 3,
    rating: 4.7,
    reviews: 342,
    features: [
      "Outdoor Seating",
      "Full Bar",
      "Private Events",
      "Valet Parking",
    ],
    dietary: ["Vegetarian", "Vegan", "Gluten-Free"],
  });

  const [availabilitySettings, setAvailabilitySettings] =
    useState({
      seatingDuration: 90,
      advanceBookingDays: 30,
      maxPartySize: 8,
      autoAccept: true,
      waitlistEnabled: true,
      takeoutEnabled: true,
      takeoutPreparationTime: 30,
      takeoutOrderMinimum: 15,
    });

  const stats = {
    totalRevenue: 74000,
    revenueChange: 12.5,
    totalReservations: 391,
    reservationsChange: 8.3,
    avgReservationValue: 189,
    avgValueChange: 5.2,
    customerSatisfaction: 4.7,
    satisfactionChange: 3.1,
    takeoutOrders: 287,
    takeoutChange: 15.8,
  };

  const handleSaveRestaurantInfo = () => {
    toast.success(
      "Restaurant information updated successfully",
    );
  };

  const handleSaveAvailability = () => {
    toast.success("Availability settings saved");
  };

  const handleSaveHours = () => {
    toast.success("Hours of operation saved");
  };

  // Table editing functions
  const handleAddTable = (shape: TableShape) => {
    if (!selectedFloor) return;

    const newTable: FloorTable = {
      id: `t-new-${Date.now()}`,
      number:
        Math.max(
          ...selectedFloor.layout.map((t) => t.number),
          0,
        ) + 1,
      floorId: selectedFloor.id,
      capacity: 4,
      shape,
      status: "available",
      position: { x: 350, y: 250 }, // Center of 800x600 canvas
      rotation: 0,
    };

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: [...f.layout, newTable],
            tableCount: f.tableCount + 1,
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    setSelectedTable(newTable);
    toast.success(`New ${shape} table added`);
  };

  const handleDeleteTable = () => {
    if (!selectedTable || !selectedFloor) return;

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: f.layout.filter(
              (t) => t.id !== selectedTable.id,
            ),
            tableCount: f.tableCount - 1,
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    setSelectedTable(null);
    toast.success("Table deleted");
  };

  const handleMoveTable = (
    direction: "up" | "down" | "left" | "right",
  ) => {
    if (!selectedTable || !selectedFloor) return;

    const moveAmount = 10;
    const newPosition = { ...selectedTable.position };

    switch (direction) {
      case "up":
        newPosition.y -= moveAmount;
        break;
      case "down":
        newPosition.y += moveAmount;
        break;
      case "left":
        newPosition.x -= moveAmount;
        break;
      case "right":
        newPosition.x += moveAmount;
        break;
    }

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: f.layout.map((t) =>
              t.id === selectedTable.id
                ? { ...t, position: newPosition }
                : t,
            ),
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    setSelectedTable({
      ...selectedTable,
      position: newPosition,
    });
  };

  const handleRotateTable = () => {
    if (!selectedTable || !selectedFloor) return;

    const newRotation =
      ((selectedTable.rotation || 0) + 45) % 360;

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: f.layout.map((t) =>
              t.id === selectedTable.id
                ? { ...t, rotation: newRotation }
                : t,
            ),
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    setSelectedTable({
      ...selectedTable,
      rotation: newRotation,
    });
  };

  const handleUpdateTableCapacity = (capacity: number) => {
    if (!selectedTable || !selectedFloor) return;

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: f.layout.map((t) =>
              t.id === selectedTable.id
                ? { ...t, capacity }
                : t,
            ),
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    setSelectedTable({ ...selectedTable, capacity });
  };

  const handleUpdateTableScale = (scale: number) => {
    if (!selectedTable || !selectedFloor) return;

    // Clamp scale between 0.5 and 2.0
    const clampedScale = Math.max(0.5, Math.min(2.0, scale));

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: f.layout.map((t) =>
              t.id === selectedTable.id
                ? { ...t, scale: clampedScale }
                : t,
            ),
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    setSelectedTable({ ...selectedTable, scale: clampedScale });
  };

  const handleTableDrop = (
    tableId: string,
    x: number,
    y: number,
  ) => {
    if (!selectedFloor) return;

    // The DroppableCanvas already adjusts for scale, so we just need to constrain the position
    const newPosition = {
      x: Math.max(0, Math.min(800 - 150, x)),
      y: Math.max(0, Math.min(600 - 100, y)),
    };

    const updatedFloors = floors.map((f) =>
      f.id === selectedFloor.id
        ? {
            ...f,
            layout: f.layout.map((t) =>
              t.id === tableId
                ? { ...t, position: newPosition }
                : t,
            ),
          }
        : f,
    );
    setFloors(updatedFloors);
    setSelectedFloor(
      updatedFloors.find((f) => f.id === selectedFloor.id) ||
        null,
    );
    if (selectedTable?.id === tableId) {
      setSelectedTable({
        ...selectedTable,
        position: newPosition,
      });
    }
  };

  const handleTableClick = (table: FloorTable) => {
    setSelectedTable(table);
    if (!isEditMode) {
      setIsTableDetailOpen(true);
    }
  };

  const handleAddFloor = () => {
    setEditingFloor(null);
    setFloorName("");
    setIsFloorDialogOpen(true);
  };

  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    setFloorName(floor.name);
    setIsFloorDialogOpen(true);
  };

  const handleSaveFloor = () => {
    if (!floorName.trim()) {
      toast.error("Please enter a floor name");
      return;
    }

    if (editingFloor) {
      // Update existing floor
      const updatedFloors = floors.map((f) =>
        f.id === editingFloor.id
          ? { ...f, name: floorName }
          : f,
      );
      setFloors(updatedFloors);
      if (selectedFloor?.id === editingFloor.id) {
        setSelectedFloor({ ...selectedFloor, name: floorName });
      }
      toast.success("Floor updated successfully");
    } else {
      // Add new floor
      const newFloor: Floor = {
        id: `floor-${Date.now()}`,
        name: floorName,
        tableCount: 0,
        layout: [],
        lastModified: new Date().toISOString(),
      };
      setFloors([...floors, newFloor]);
      setSelectedFloor(newFloor);
      toast.success("Floor added successfully");
    }
    setIsFloorDialogOpen(false);
    setEditingFloor(null);
    setFloorName("");
  };

  const handleDeleteFloor = (floorId: string) => {
    if (floors.length === 1) {
      toast.error("Cannot delete the last floor");
      return;
    }
    const updatedFloors = floors.filter(
      (f) => f.id !== floorId,
    );
    setFloors(updatedFloors);
    if (selectedFloor?.id === floorId) {
      setSelectedFloor(updatedFloors[0]);
    }
    toast.success("Floor deleted successfully");
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    setTakeoutOrders((orders) =>
      orders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order,
      ),
    );
    toast.success(`Order ${newStatus}`);
  };

  const handleAddMenuItem = () => {
    setSelectedMenuItem({
      id: "",
      name: "",
      description: "",
      price: 0,
      category: "Entrees",
      available: true,
      takeoutAvailable: true,
    });
    setIsMenuDialogOpen(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsMenuDialogOpen(true);
  };

  const handleSaveMenuItem = () => {
    if (!selectedMenuItem) return;

    if (selectedMenuItem.id) {
      // Update existing
      setMenu(
        menu.map((item) =>
          item.id === selectedMenuItem.id
            ? selectedMenuItem
            : item,
        ),
      );
      toast.success("Menu item updated");
    } else {
      // Add new
      const newItem = {
        ...selectedMenuItem,
        id: `m-${Date.now()}`,
      };
      setMenu([...menu, newItem]);
      toast.success("Menu item added");
    }
    setIsMenuDialogOpen(false);
    setSelectedMenuItem(null);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenu(menu.filter((item) => item.id !== itemId));
    toast.success("Menu item deleted");
  };

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "confirmed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "preparing":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "ready":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-900">
        <div className="container mx-auto p-4 sm:p-6 max-w-[1800px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl text-slate-100 mb-2">
                Manager Console
              </h1>
              <p className="text-slate-400">
                Full restaurant operations & customization
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="dashboard" className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto min-w-full bg-slate-800 mb-6 p-1">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-slate-700 whitespace-nowrap"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="operations"
                  className="data-[state=active]:bg-slate-700 whitespace-nowrap"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Dine-In
                </TabsTrigger>
                <TabsTrigger
                  value="takeout"
                  className="data-[state=active]:bg-slate-700 whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Takeout
                </TabsTrigger>
                <TabsTrigger
                  value="listing"
                  className="data-[state=active]:bg-slate-700 whitespace-nowrap"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Listing
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-slate-700 whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-slate-700 whitespace-nowrap"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            {/* ===== DASHBOARD TAB ===== */}
            <TabsContent
              value="dashboard"
              className="space-y-6"
            >
              {/* Time Range Selector */}
              <div className="flex flex-wrap gap-2">
                {["week", "month", "quarter", "year"].map(
                  (range) => (
                    <Button
                      key={range}
                      variant={
                        timeRange === range
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={
                        timeRange === range
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "border-slate-600 text-slate-300 hover:bg-slate-700"
                      }
                    >
                      {range.charAt(0).toUpperCase() +
                        range.slice(1)}
                    </Button>
                  ),
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stats.revenueChange}%
                      </Badge>
                    </div>
                    <div className="text-2xl sm:text-3xl text-slate-100 mb-1">
                      ${stats.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-400">
                      Total Revenue
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stats.reservationsChange}%
                      </Badge>
                    </div>
                    <div className="text-2xl sm:text-3xl text-slate-100 mb-1">
                      {stats.totalReservations}
                    </div>
                    <div className="text-sm text-slate-400">
                      Dine-In Reservations
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stats.takeoutChange}%
                      </Badge>
                    </div>
                    <div className="text-2xl sm:text-3xl text-slate-100 mb-1">
                      {stats.takeoutOrders}
                    </div>
                    <div className="text-sm text-slate-400">
                      Takeout Orders
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stats.satisfactionChange}%
                      </Badge>
                    </div>
                    <div className="text-2xl sm:text-3xl text-slate-100 mb-1">
                      {stats.customerSatisfaction}
                    </div>
                    <div className="text-sm text-slate-400">
                      Customer Rating
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                  <h3 className="text-lg sm:text-xl text-slate-100 mb-4 sm:mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Revenue by Channel
                  </h3>
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                  >
                    <BarChart data={revenueData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="reservations"
                        name="Dine-In"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="takeout"
                        name="Takeout"
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Reservation Sources */}
                <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                  <h3 className="text-lg sm:text-xl text-slate-100 mb-4 sm:mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Reservation Sources
                  </h3>
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                  >
                    <PieChart>
                      <Pie
                        data={reservationSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reservationSources.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </TabsContent>

            {/* ===== DINE-IN OPERATIONS TAB ===== */}
            <TabsContent
              value="operations"
              className="space-y-6"
            >
              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={
                      dineInView === "floor"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setDineInView("floor")}
                    className={
                      dineInView === "floor"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-slate-600 text-slate-300"
                    }
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Floor Plan
                  </Button>
                  <Button
                    variant={
                      dineInView === "list"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setDineInView("list")}
                    className={
                      dineInView === "list"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-slate-600 text-slate-300"
                    }
                  >
                    <Columns className="w-4 h-4 mr-2" />
                    Kanban View
                  </Button>
                </div>

                {dineInView === "list" && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300"
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {selectedDate.toLocaleDateString()}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      New Reservation
                    </Button>
                  </div>
                )}
              </div>

              {/* Floor Plan View */}
              {dineInView === "floor" && (
                <>
                  {/* VIEW MODE - Full Screen Floor Plan */}
                  {!isEditMode && (
                    <div className="space-y-6">
                      {/* Floor Selector & Controls */}
                      <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                            <Select
                              value={selectedFloor?.id}
                              onValueChange={(val) =>
                                setSelectedFloor(
                                  floors.find(
                                    (f) => f.id === val,
                                  ) || null,
                                )
                              }
                            >
                              <SelectTrigger className="w-full sm:w-[160px] bg-slate-700 border-slate-600 text-slate-100">
                                <SelectValue placeholder="Select Floor" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {floors.map((floor) => (
                                  <SelectItem
                                    key={floor.id}
                                    value={floor.id}
                                    className="text-slate-100"
                                  >
                                    {floor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddFloor}
                              className="border-slate-600 text-slate-300"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Floor
                            </Button>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                              >
                                <span className="hidden sm:inline">
                                  {selectedFloor?.layout.filter(
                                    (t) =>
                                      t.status === "available",
                                  ).length || 0}{" "}
                                  Available
                                </span>
                                <span className="sm:hidden">
                                  {selectedFloor?.layout.filter(
                                    (t) =>
                                      t.status === "available",
                                  ).length || 0}{" "}
                                  Avail
                                </span>
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-slate-600/30 text-slate-300 border-slate-500/30 text-xs"
                              >
                                <span className="hidden sm:inline">
                                  {selectedFloor?.layout.filter(
                                    (t) =>
                                      t.status === "reserved",
                                  ).length || 0}{" "}
                                  Reserved
                                </span>
                                <span className="sm:hidden">
                                  {selectedFloor?.layout.filter(
                                    (t) =>
                                      t.status === "reserved",
                                  ).length || 0}{" "}
                                  Res
                                </span>
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs"
                              >
                                <span className="hidden sm:inline">
                                  {selectedFloor?.layout.filter(
                                    (t) =>
                                      t.status === "occupied",
                                  ).length || 0}{" "}
                                  Occupied
                                </span>
                                <span className="sm:hidden">
                                  {selectedFloor?.layout.filter(
                                    (t) =>
                                      t.status === "occupied",
                                  ).length || 0}{" "}
                                  Occ
                                </span>
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setScale(
                                    Math.max(0.3, scale - 0.1),
                                  )
                                }
                                className="border-slate-600 text-slate-300"
                              >
                                <ZoomOut className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setScale(
                                    Math.min(1.5, scale + 0.1),
                                  )
                                }
                                className="border-slate-600 text-slate-300"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                            </div>
                            <Badge
                              variant="outline"
                              className="hidden md:inline-flex bg-slate-700/50 text-slate-400 border-slate-600 text-xs"
                            >
                              Pinch/Ctrl+Scroll to zoom • Drag
                              to pan
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() =>
                                setIsEditMode(true)
                              }
                              className="bg-blue-600 hover:bg-blue-700 flex-1 lg:flex-none"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">
                                Edit Layout
                              </span>
                              <span className="sm:hidden">
                                Edit
                              </span>
                            </Button>
                          </div>
                        </div>
                      </Card>

                      {/* Floor Canvas with Table List Sidebar */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Floor Canvas */}
                        <div className="lg:col-span-9">
                          <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                            <div
                              className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700/50 overflow-hidden shadow-2xl"
                              style={{
                                height: "500px",
                                maxHeight:
                                  "calc(100vh - 350px)",
                              }}
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                              <PannableCanvas
                                scale={scale}
                                onScaleChange={setScale}
                              >
                                <div
                                  className="relative"
                                  style={{
                                    width: "800px",
                                    height: "600px",
                                  }}
                                >
                                  {selectedFloor?.layout.map(
                                    (table) => (
                                      <TableComponent
                                        key={table.id}
                                        table={table}
                                        onClick={() =>
                                          handleTableClick(
                                            table,
                                          )
                                        }
                                        selectedId={
                                          selectedTable?.id
                                        }
                                        isEditMode={false}
                                      />
                                    ),
                                  )}
                                </div>
                              </PannableCanvas>
                            </div>
                          </Card>
                        </div>

                        {/* Table List Sidebar */}
                        <div className="lg:col-span-3">
                          <Card className="p-4 bg-slate-800 border-slate-700 sticky top-4">
                            <h3 className="text-sm text-slate-100 mb-4 flex items-center gap-2">
                              <List className="w-4 h-4" />
                              Tables on Floor (
                              {selectedFloor?.layout.length ||
                                0}
                              )
                            </h3>
                            <ScrollArea className="h-[calc(100vh-420px)]">
                              <div className="space-y-2">
                                {selectedFloor?.layout.map(
                                  (table) => {
                                    const reservation =
                                      table.reservationId
                                        ? reservations.find(
                                            (r) =>
                                              r.id ===
                                              table.reservationId,
                                          )
                                        : null;
                                    return (
                                      <button
                                        key={table.id}
                                        onClick={() =>
                                          handleTableClick(
                                            table,
                                          )
                                        }
                                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                                          selectedTable?.id ===
                                          table.id
                                            ? "bg-blue-600/20 border-blue-500/50"
                                            : "bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-slate-100 font-medium">
                                            Table {table.number}
                                          </span>
                                          <Badge
                                            className={`text-xs ${
                                              table.status ===
                                              "available"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : table.status ===
                                                    "occupied"
                                                  ? "bg-orange-500/20 text-orange-400"
                                                  : "bg-slate-600/30 text-slate-300"
                                            }`}
                                          >
                                            {table.status}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                          <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>
                                              {table.capacity}
                                            </span>
                                          </div>
                                          {table.shape && (
                                            <span className="capitalize">
                                              {table.shape}
                                            </span>
                                          )}
                                        </div>
                                        {reservation && (
                                          <div className="mt-2 pt-2 border-t border-slate-600/50 text-xs">
                                            <div className="text-slate-300">
                                              {
                                                reservation.guestName
                                              }
                                            </div>
                                            <div className="text-slate-500 flex items-center gap-2 mt-1">
                                              <Clock className="w-3 h-3" />
                                              {new Date(
                                                reservation.time,
                                              ).toLocaleTimeString(
                                                [],
                                                {
                                                  hour: "2-digit",
                                                  minute:
                                                    "2-digit",
                                                },
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </ScrollArea>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EDIT MODE - Dual Sidebar Layout */}
                  {isEditMode && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Sidebar - Add Tables */}
                      <div className="lg:col-span-2 space-y-4">
                        <Card className="p-4 bg-slate-800 border-slate-700">
                          <h3 className="text-sm text-slate-100 mb-3">
                            Add Tables
                          </h3>
                          <ScrollArea className="h-[400px] pr-3">
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("round")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <Circle className="w-4 h-4 mr-2" />
                                Round
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("square")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Square
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("rectangular")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <RectangleHorizontal className="w-4 h-4 mr-2" />
                                Rectangle
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("oval")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <Circle className="w-4 h-4 mr-2" />
                                Oval
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("diamond")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <Diamond className="w-4 h-4 mr-2" />
                                Diamond
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("hexagon")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <Hexagon className="w-4 h-4 mr-2" />
                                Hexagon
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("booth")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Booth
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("bar")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <RectangleHorizontal className="w-4 h-4 mr-2" />
                                Bar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAddTable("banquet")
                                }
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                              >
                                <RectangleHorizontal className="w-4 h-4 mr-2" />
                                Banquet
                              </Button>
                            </div>
                          </ScrollArea>
                        </Card>

                        <Card className="p-4 bg-slate-800 border-slate-700">
                          <h3 className="text-sm text-slate-100 mb-3">
                            Floor Stats
                          </h3>
                          <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex justify-between">
                              <span>Total Tables:</span>
                              <span className="text-slate-100">
                                {selectedFloor?.tableCount || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span className="text-emerald-400">
                                {selectedFloor?.layout.filter(
                                  (t) =>
                                    t.status === "available",
                                ).length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reserved:</span>
                              <span className="text-slate-400">
                                {selectedFloor?.layout.filter(
                                  (t) =>
                                    t.status === "reserved",
                                ).length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Occupied:</span>
                              <span className="text-orange-400">
                                {selectedFloor?.layout.filter(
                                  (t) =>
                                    t.status === "occupied",
                                ).length || 0}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Center - Floor Canvas */}
                      <div className="lg:col-span-8 space-y-4">
                        <Card className="p-3 sm:p-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                              <Select
                                value={selectedFloor?.id}
                                onValueChange={(val) =>
                                  setSelectedFloor(
                                    floors.find(
                                      (f) => f.id === val,
                                    ) || null,
                                  )
                                }
                              >
                                <SelectTrigger className="w-full sm:w-[160px] bg-slate-700 border-slate-600 text-slate-100">
                                  <SelectValue placeholder="Select Floor" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {floors.map((floor) => (
                                    <SelectItem
                                      key={floor.id}
                                      value={floor.id}
                                      className="text-slate-100"
                                    >
                                      {floor.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddFloor}
                                className="border-slate-600 text-slate-300"
                              >
                                <Plus className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                  Add Floor
                                </span>
                              </Button>
                              {selectedFloor && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditFloor(
                                        selectedFloor,
                                      )
                                    }
                                    className="border-slate-600 text-slate-300"
                                  >
                                    <Edit2 className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                      Edit Floor
                                    </span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteFloor(
                                        selectedFloor.id,
                                      )
                                    }
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                      Delete Floor
                                    </span>
                                  </Button>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setScale(
                                      Math.max(
                                        0.3,
                                        scale - 0.1,
                                      ),
                                    )
                                  }
                                  className="border-slate-600 text-slate-300"
                                >
                                  <ZoomOut className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setScale(
                                      Math.min(
                                        1.5,
                                        scale + 0.1,
                                      ),
                                    )
                                  }
                                  className="border-slate-600 text-slate-300"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </Button>
                              </div>
                              <Badge
                                variant="outline"
                                className="hidden md:inline-flex bg-slate-700/50 text-slate-400 border-slate-600 text-xs"
                              >
                                Pinch/Ctrl+Scroll to zoom • Drag
                                to pan
                              </Badge>
                            </div>
                          </div>

                          <div
                            className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700/50 overflow-hidden shadow-2xl"
                            style={{
                              height: "500px",
                              maxHeight: "calc(100vh - 350px)",
                            }}
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                            <DroppableCanvas
                              scale={scale}
                              onScaleChange={setScale}
                              onDrop={(x, y) => {
                                if (selectedTable) {
                                  handleTableDrop(
                                    selectedTable.id,
                                    x,
                                    y,
                                  );
                                }
                              }}
                            >
                              {selectedFloor?.layout.map(
                                (table) => (
                                  <TableComponent
                                    key={table.id}
                                    table={table}
                                    onClick={() =>
                                      handleTableClick(table)
                                    }
                                    onDrop={handleTableDrop}
                                    selectedId={
                                      selectedTable?.id
                                    }
                                    isEditMode={true}
                                  />
                                ),
                              )}
                            </DroppableCanvas>
                          </div>
                        </Card>

                        {/* Edit Mode Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditMode(false);
                              setSelectedTable(null);
                            }}
                            className="border-slate-600 text-slate-300"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              toast.success(
                                "Floor plan saved successfully",
                              );
                              setIsEditMode(false);
                              setSelectedTable(null);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>

                      {/* Right Sidebar - Table Controls */}
                      <div className="lg:col-span-2 space-y-4">
                        {selectedTable ? (
                          <Card className="p-4 bg-slate-800 border-slate-700">
                            <h3 className="text-sm text-slate-100 mb-3 flex items-center gap-2">
                              <Edit2 className="w-4 h-4 text-amber-400" />
                              Table T{selectedTable.number}
                            </h3>

                            {/* Capacity Selector */}
                            <div className="mb-4">
                              <Label className="text-xs text-slate-400 mb-2 block">
                                Capacity
                              </Label>
                              <div className="grid grid-cols-4 gap-1">
                                {[2, 4, 6, 8].map((cap) => (
                                  <Button
                                    key={cap}
                                    variant={
                                      selectedTable.capacity ===
                                      cap
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateTableCapacity(
                                        cap,
                                      )
                                    }
                                    className={
                                      selectedTable.capacity ===
                                      cap
                                        ? "bg-blue-600 hover:bg-blue-700 text-xs"
                                        : "border-slate-600 text-slate-300 text-xs"
                                    }
                                  >
                                    {cap}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Position Controls */}
                            <div className="mb-4">
                              <Label className="text-xs text-slate-400 mb-2 block">
                                Position
                              </Label>
                              <div className="grid grid-cols-3 gap-1">
                                <div></div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMoveTable("up")
                                  }
                                  className="border-slate-600 text-slate-300"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <div></div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMoveTable("left")
                                  }
                                  className="border-slate-600 text-slate-300"
                                >
                                  <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRotateTable}
                                  className="border-slate-600 text-slate-300"
                                >
                                  <RotateCw className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMoveTable("right")
                                  }
                                  className="border-slate-600 text-slate-300"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                                <div></div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMoveTable("down")
                                  }
                                  className="border-slate-600 text-slate-300"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                                <div></div>
                              </div>
                              <div className="mt-2 text-xs text-slate-500 text-center">
                                Rotation:{" "}
                                {selectedTable.rotation || 0}°
                              </div>
                            </div>

                            {/* Size Controls */}
                            <div className="mb-4">
                              <Label className="text-xs text-slate-400 mb-2 block">
                                Table Size
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleUpdateTableScale(
                                      (selectedTable.scale ||
                                        1.0) - 0.1,
                                    )
                                  }
                                  disabled={
                                    (selectedTable.scale ||
                                      1.0) <= 0.5
                                  }
                                  className="w-full border-slate-600 text-slate-300"
                                >
                                  <ZoomOut className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleUpdateTableScale(
                                      (selectedTable.scale ||
                                        1.0) + 0.1,
                                    )
                                  }
                                  disabled={
                                    (selectedTable.scale ||
                                      1.0) >= 2.0
                                  }
                                  className="w-full border-slate-600 text-slate-300"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="mt-2 text-xs text-slate-500 text-center">
                                {(
                                  (selectedTable.scale || 1.0) *
                                  100
                                ).toFixed(0)}
                                % • Range: 50% - 200%
                              </div>
                            </div>

                            {/* Delete Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteTable}
                              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Table
                            </Button>
                          </Card>
                        ) : (
                          <Card className="p-4 bg-slate-800 border-slate-700">
                            <div className="text-center py-8 text-slate-400">
                              <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">
                                Select a table to edit
                              </p>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Table Detail Modal (View Mode) */}
                  <Dialog
                    open={isTableDetailOpen && !isEditMode}
                    onOpenChange={setIsTableDetailOpen}
                  >
                    <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          Table {selectedTable?.number} Details
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                          View table information and current
                          status
                        </DialogDescription>
                      </DialogHeader>
                      {selectedTable && (
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                Table Number
                              </div>
                              <div className="text-2xl">
                                T{selectedTable.number}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400 mb-1">
                                Capacity
                              </div>
                              <div className="text-2xl flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {selectedTable.capacity}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-700/50 rounded-lg">
                            <div className="text-sm text-slate-400 mb-2">
                              Current Status
                            </div>
                            <Badge
                              className={`text-sm px-3 py-1 ${
                                selectedTable.status ===
                                "available"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : selectedTable.status ===
                                      "occupied"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                    : "bg-slate-600/30 text-slate-300 border-slate-500/30"
                              }`}
                            >
                              {selectedTable.status
                                .charAt(0)
                                .toUpperCase() +
                                selectedTable.status.slice(1)}
                            </Badge>
                          </div>

                          {selectedTable.reservationId && (
                            <div className="p-4 bg-slate-700/50 rounded-lg">
                              <div className="text-sm text-slate-400 mb-2">
                                Active Reservation
                              </div>
                              {(() => {
                                const reservation =
                                  reservations.find(
                                    (r) =>
                                      r.id ===
                                      selectedTable.reservationId,
                                  );
                                return reservation ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="w-4 h-4 text-blue-400" />
                                      <span>
                                        {reservation.guestName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {new Date(
                                          reservation.time,
                                        ).toLocaleTimeString(
                                          [],
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          },
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                      <Users className="w-4 h-4" />
                                      <span>
                                        {reservation.partySize}{" "}
                                        guests
                                      </span>
                                    </div>
                                    {reservation.notes && (
                                      <div className="mt-2 pt-2 border-t border-slate-600 text-sm text-slate-400">
                                        {reservation.notes}
                                      </div>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setIsTableDetailOpen(false)
                          }
                          className="border-slate-600 text-slate-300"
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {/* Kanban List View */}
              {dineInView === "list" && (
                <div className="h-[calc(100vh-250px)]">
                  <ReservationKanbanView
                    reservations={reservations.map((r) => ({
                      ...r,
                      status:
                        r.status === "seated"
                          ? "seated"
                          : r.status === "completed"
                            ? "completed"
                            : "waiting",
                    }))}
                    waitlist={waitlist}
                    tables={floors.flatMap((f) => f.layout)}
                    onReservationClick={(reservation) => {
                      setSelectedReservation(reservation);
                    }}
                    onSeatGuest={(id, tableId) => {
                      if (id.startsWith("wait-")) {
                        // Seating from waitlist
                        const guest = waitlist.find(
                          (g) => g.id === id,
                        );
                        if (guest) {
                          const updatedWaitlist =
                            waitlist.filter((g) => g.id !== id);
                          setWaitlist(updatedWaitlist);

                          // Update table status to occupied
                          const updatedFloors = floors.map(
                            (f) => ({
                              ...f,
                              layout: f.layout.map((t) =>
                                t.id === tableId
                                  ? {
                                      ...t,
                                      status:
                                        "occupied" as TableStatus,
                                    }
                                  : t,
                              ),
                            }),
                          );
                          setFloors(updatedFloors);

                          toast.success(
                            `${guest.guestName} seated at table ${floors.flatMap((f) => f.layout).find((t) => t.id === tableId)?.number || ""}`,
                          );
                        }
                      } else {
                        // Seating reservation
                        const updatedReservations =
                          reservations.map((r) =>
                            r.id === id
                              ? {
                                  ...r,
                                  status:
                                    "seated" as ReservationStatus,
                                  tableId,
                                }
                              : r,
                          );
                        setReservations(updatedReservations);

                        // Update table status to occupied
                        const updatedFloors = floors.map(
                          (f) => ({
                            ...f,
                            layout: f.layout.map((t) =>
                              t.id === tableId
                                ? {
                                    ...t,
                                    status:
                                      "occupied" as TableStatus,
                                    reservationId: id,
                                  }
                                : t,
                            ),
                          }),
                        );
                        setFloors(updatedFloors);

                        const reservation = reservations.find(
                          (r) => r.id === id,
                        );
                        toast.success(
                          `${reservation?.guestName || "Guest"} seated at table ${floors.flatMap((f) => f.layout).find((t) => t.id === tableId)?.number || ""}`,
                        );
                      }
                    }}
                  />
                </div>
              )}
            </TabsContent>

            {/* ===== TAKEOUT OPERATIONS TAB ===== */}
            <TabsContent value="takeout" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl text-slate-100">
                        {
                          takeoutOrders.filter(
                            (o) => o.status === "pending",
                          ).length
                        }
                      </div>
                      <div className="text-sm text-slate-400">
                        Pending
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl text-slate-100">
                        {
                          takeoutOrders.filter(
                            (o) => o.status === "preparing",
                          ).length
                        }
                      </div>
                      <div className="text-sm text-slate-400">
                        Preparing
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl text-slate-100">
                        {
                          takeoutOrders.filter(
                            (o) => o.status === "ready",
                          ).length
                        }
                      </div>
                      <div className="text-sm text-slate-400">
                        Ready
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl text-slate-100">
                        $
                        {takeoutOrders
                          .reduce((sum, o) => sum + o.total, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        Today's Total
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Active Orders */}
              <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                <h3 className="text-lg sm:text-xl text-slate-100 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                  Active Takeout Orders
                </h3>

                <div className="space-y-4">
                  {takeoutOrders
                    .filter(
                      (order) =>
                        !["completed", "cancelled"].includes(
                          order.status,
                        ),
                    )
                    .map((order) => (
                      <Card
                        key={order.id}
                        className="p-4 bg-slate-900 border-slate-700"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg text-slate-100">
                                {order.orderNumber}
                              </span>
                              <Badge
                                className={getOrderStatusColor(
                                  order.status,
                                )}
                              >
                                {order.status
                                  .charAt(0)
                                  .toUpperCase() +
                                  order.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-400">
                              {order.customerName} •{" "}
                              {order.phone}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl text-green-400">
                              ${order.total}
                            </div>
                            <div className="text-sm text-slate-400">
                              Pickup:{" "}
                              {new Date(
                                order.pickupTime,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-300">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-slate-400">
                                $
                                {(
                                  item.quantity * item.price
                                ).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "confirmed",
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Confirm
                            </Button>
                          )}
                          {order.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "preparing",
                                )
                              }
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Start Preparing
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "ready",
                                )
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "completed",
                                )
                              }
                              className="bg-slate-600 hover:bg-slate-700"
                            >
                              <Truck className="w-4 h-4 mr-2" />
                              Complete Pickup
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-400"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                          {order.status !== "ready" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "cancelled",
                                )
                              }
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </Card>
            </TabsContent>

            {/* ===== LISTING TAB (with Menu & Hours) ===== */}
            <TabsContent value="listing" className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-slate-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Restaurant Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="menu"
                    className="data-[state=active]:bg-slate-700"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Menu
                  </TabsTrigger>
                  <TabsTrigger
                    value="hours"
                    className="data-[state=active]:bg-slate-700"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Hours
                  </TabsTrigger>
                </TabsList>

                {/* Restaurant Info Tab */}
                <TabsContent
                  value="info"
                  className="space-y-6 mt-6"
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-400" />
                        Restaurant Listing
                      </h3>
                      <Button
                        onClick={handleSaveRestaurantInfo}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h4 className="text-slate-100 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          Basic Information
                        </h4>

                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="text-slate-200"
                          >
                            Restaurant Name
                          </Label>
                          <Input
                            id="name"
                            value={restaurantInfo.name}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                name: e.target.value,
                              })
                            }
                            className="bg-slate-700 border-slate-600 text-slate-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="cuisine"
                            className="text-slate-200"
                          >
                            Cuisine Type
                          </Label>
                          <Input
                            id="cuisine"
                            value={restaurantInfo.cuisine}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                cuisine: e.target.value,
                              })
                            }
                            className="bg-slate-700 border-slate-600 text-slate-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="description"
                            className="text-slate-200"
                          >
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={restaurantInfo.description}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                description: e.target.value,
                              })
                            }
                            className="bg-slate-700 border-slate-600 text-slate-100"
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="address"
                            className="text-slate-200"
                          >
                            Address
                          </Label>
                          <Input
                            id="address"
                            value={restaurantInfo.address}
                            onChange={(e) =>
                              setRestaurantInfo({
                                ...restaurantInfo,
                                address: e.target.value,
                              })
                            }
                            className="bg-slate-700 border-slate-600 text-slate-100"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="phone"
                              className="text-slate-200"
                            >
                              Phone
                            </Label>
                            <Input
                              id="phone"
                              value={restaurantInfo.phone}
                              onChange={(e) =>
                                setRestaurantInfo({
                                  ...restaurantInfo,
                                  phone: e.target.value,
                                })
                              }
                              className="bg-slate-700 border-slate-600 text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="email"
                              className="text-slate-200"
                            >
                              Email
                            </Label>
                            <Input
                              id="email"
                              value={restaurantInfo.email}
                              onChange={(e) =>
                                setRestaurantInfo({
                                  ...restaurantInfo,
                                  email: e.target.value,
                                })
                              }
                              className="bg-slate-700 border-slate-600 text-slate-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Listing Preview */}
                      <div className="space-y-4">
                        <h4 className="text-slate-100 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          Consumer View Preview
                        </h4>

                        <Card className="p-4 bg-slate-900 border-slate-700">
                          <div className="aspect-video bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-4 flex items-center justify-center">
                            <Image className="w-12 h-12 text-white/50" />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg text-slate-100">
                                {restaurantInfo.name}
                              </h3>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-slate-100">
                                  {restaurantInfo.rating}
                                </span>
                                <span className="text-slate-400 text-sm">
                                  ({restaurantInfo.reviews})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Utensils className="w-4 h-4" />
                              {restaurantInfo.cuisine}
                              <span className="mx-2">•</span>
                              {"$".repeat(
                                restaurantInfo.priceLevel,
                              )}
                            </div>

                            <p className="text-sm text-slate-300">
                              {restaurantInfo.description}
                            </p>

                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-4 h-4" />
                              {restaurantInfo.address}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {restaurantInfo.features.map(
                                (feature, idx) => (
                                  <Badge
                                    key={idx}
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  >
                                    {feature}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        </Card>

                        {/* Ranking & Visibility */}
                        <Card className="p-4 bg-slate-900 border-slate-700">
                          <h4 className="text-slate-100 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-400" />
                            Search Ranking
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-400">
                                Average Position
                              </span>
                              <Badge className="bg-green-500/20 text-green-400">
                                #3
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-400">
                                Visibility Score
                              </span>
                              <span className="text-slate-100">
                                87%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-400">
                                Click-through Rate
                              </span>
                              <span className="text-slate-100">
                                12.4%
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Menu Tab */}
                <TabsContent
                  value="menu"
                  className="space-y-6 mt-6"
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-green-400" />
                        Menu Items Management
                      </h3>
                      <Button
                        onClick={handleAddMenuItem}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Menu Item
                      </Button>
                    </div>

                    {/* Menu Items by Category */}
                    {menuCategories.map((category) => {
                      const categoryItems = menu.filter(
                        (item) => item.category === category,
                      );
                      if (categoryItems.length === 0)
                        return null;

                      return (
                        <div key={category} className="mb-6">
                          <h4 className="text-lg text-slate-100 mb-4 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-blue-400" />
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryItems.map((item) => (
                              <Card
                                key={item.id}
                                className="p-4 bg-slate-900 border-slate-700"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="text-slate-100 mb-1">
                                      {item.name}
                                    </h5>
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                      {item.description}
                                    </p>
                                  </div>
                                  {item.popular && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-2">
                                      <Star className="w-3 h-3" />
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xl text-green-400">
                                    ${item.price}
                                  </span>
                                  <div className="flex gap-2">
                                    <Badge
                                      className={
                                        item.available
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-red-500/20 text-red-400"
                                      }
                                    >
                                      {item.available
                                        ? "Available"
                                        : "Unavailable"}
                                    </Badge>
                                  </div>
                                </div>

                                {item.dietary &&
                                  item.dietary.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {item.dietary.map(
                                        (tag, idx) => (
                                          <Badge
                                            key={idx}
                                            className="bg-blue-500/20 text-blue-400 text-xs"
                                          >
                                            {tag}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  )}

                                {item.takeoutAvailable && (
                                  <div className="flex items-center gap-2 text-xs text-purple-400 mb-3">
                                    <ShoppingBag className="w-3 h-3" />
                                    Available for takeout
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditMenuItem(item)
                                    }
                                    className="flex-1 border-slate-600 text-slate-300"
                                  >
                                    <Edit2 className="w-3 h-3 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteMenuItem(
                                        item.id,
                                      )
                                    }
                                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                </TabsContent>

                {/* Hours Tab */}
                <TabsContent
                  value="hours"
                  className="space-y-6 mt-6"
                >
                  <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Hours of Operation
                      </h3>
                      <Button
                        onClick={handleSaveHours}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Hours
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {hours.map((dayHours) => (
                        <Card
                          key={dayHours.day}
                          className="p-4 bg-slate-900 border-slate-700"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-full sm:w-32">
                              <div className="text-slate-100 capitalize">
                                {dayHours.day}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Switch
                                checked={dayHours.isOpen}
                                onCheckedChange={(checked) => {
                                  setHours(
                                    hours.map((h) =>
                                      h.day === dayHours.day
                                        ? {
                                            ...h,
                                            isOpen: checked,
                                          }
                                        : h,
                                    ),
                                  );
                                }}
                              />
                              <span className="text-sm text-slate-400">
                                {dayHours.isOpen
                                  ? "Open"
                                  : "Closed"}
                              </span>
                            </div>

                            {dayHours.isOpen && (
                              <>
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    type="time"
                                    value={dayHours.openTime}
                                    onChange={(e) => {
                                      setHours(
                                        hours.map((h) =>
                                          h.day === dayHours.day
                                            ? {
                                                ...h,
                                                openTime:
                                                  e.target
                                                    .value,
                                              }
                                            : h,
                                        ),
                                      );
                                    }}
                                    className="bg-slate-700 border-slate-600 text-slate-100"
                                  />
                                  <span className="text-slate-400">
                                    to
                                  </span>
                                  <Input
                                    type="time"
                                    value={dayHours.closeTime}
                                    onChange={(e) => {
                                      setHours(
                                        hours.map((h) =>
                                          h.day === dayHours.day
                                            ? {
                                                ...h,
                                                closeTime:
                                                  e.target
                                                    .value,
                                              }
                                            : h,
                                        ),
                                      );
                                    }}
                                    className="bg-slate-700 border-slate-600 text-slate-100"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const weekdayHours = hours.find(
                            (h) => h.day === "monday",
                          );
                          if (weekdayHours) {
                            setHours(
                              hours.map((h) =>
                                [
                                  "monday",
                                  "tuesday",
                                  "wednesday",
                                  "thursday",
                                  "friday",
                                ].includes(h.day)
                                  ? {
                                      ...h,
                                      isOpen:
                                        weekdayHours.isOpen,
                                      openTime:
                                        weekdayHours.openTime,
                                      closeTime:
                                        weekdayHours.closeTime,
                                    }
                                  : h,
                              ),
                            );
                            toast.success(
                              "Applied Monday hours to all weekdays",
                            );
                          }
                        }}
                        className="border-slate-600 text-slate-300"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Weekdays
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHours(
                            hours.map((h) => ({
                              ...h,
                              isOpen: true,
                            })),
                          );
                          toast.success("Opened all days");
                        }}
                        className="border-slate-600 text-slate-300"
                      >
                        Open All Days
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ===== ANALYTICS TAB ===== */}
            <TabsContent
              value="analytics"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Hours */}
                <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                  <h3 className="text-lg sm:text-xl text-slate-100 mb-4 sm:mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Peak Booking Hours
                  </h3>
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                  >
                    <BarChart data={popularTimes}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis dataKey="hour" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="bookings"
                        fill="#06b6d4"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Monthly Comparison */}
                <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                  <h3 className="text-lg sm:text-xl text-slate-100 mb-4 sm:mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Monthly Comparison
                  </h3>
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                  >
                    <BarChart data={revenueData.slice(-6)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="reservations"
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Top Dishes */}
              <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                <h3 className="text-lg sm:text-xl text-slate-100 mb-4 sm:mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Top Performing Dishes
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {topDishes.map((dish, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm sm:text-base">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="text-slate-100">
                            {dish.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {dish.orders} orders
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg text-green-400">
                          ${dish.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">
                          Revenue
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ===== SETTINGS TAB ===== */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    Operations Settings
                  </h3>
                  <Button
                    onClick={handleSaveAvailability}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dine-In Settings */}
                  <div className="space-y-4">
                    <h4 className="text-slate-100 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-blue-400" />
                      Dine-In Settings
                    </h4>

                    <div className="space-y-2">
                      <Label
                        htmlFor="seatingDuration"
                        className="text-slate-200"
                      >
                        Seating Duration (minutes)
                      </Label>
                      <Input
                        id="seatingDuration"
                        type="number"
                        value={
                          availabilitySettings.seatingDuration
                        }
                        onChange={(e) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            seatingDuration: parseInt(
                              e.target.value,
                            ),
                          })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="advanceBooking"
                        className="text-slate-200"
                      >
                        Advance Booking Days
                      </Label>
                      <Input
                        id="advanceBooking"
                        type="number"
                        value={
                          availabilitySettings.advanceBookingDays
                        }
                        onChange={(e) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            advanceBookingDays: parseInt(
                              e.target.value,
                            ),
                          })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="maxParty"
                        className="text-slate-200"
                      >
                        Maximum Party Size
                      </Label>
                      <Input
                        id="maxParty"
                        type="number"
                        value={
                          availabilitySettings.maxPartySize
                        }
                        onChange={(e) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            maxPartySize: parseInt(
                              e.target.value,
                            ),
                          })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <Label
                          htmlFor="autoAccept"
                          className="text-slate-200"
                        >
                          Auto-Accept Reservations
                        </Label>
                        <p className="text-sm text-slate-400 mt-1">
                          Automatically confirm new bookings
                        </p>
                      </div>
                      <Switch
                        id="autoAccept"
                        checked={
                          availabilitySettings.autoAccept
                        }
                        onCheckedChange={(checked) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            autoAccept: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <Label
                          htmlFor="waitlist"
                          className="text-slate-200"
                        >
                          Enable Waitlist
                        </Label>
                        <p className="text-sm text-slate-400 mt-1">
                          Allow guests to join waitlist
                        </p>
                      </div>
                      <Switch
                        id="waitlist"
                        checked={
                          availabilitySettings.waitlistEnabled
                        }
                        onCheckedChange={(checked) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            waitlistEnabled: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Takeout Settings */}
                  <div className="space-y-4">
                    <h4 className="text-slate-100 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-purple-400" />
                      Takeout Settings
                    </h4>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <Label
                          htmlFor="takeoutEnabled"
                          className="text-slate-200"
                        >
                          Enable Takeout Orders
                        </Label>
                        <p className="text-sm text-slate-400 mt-1">
                          Accept online pickup orders
                        </p>
                      </div>
                      <Switch
                        id="takeoutEnabled"
                        checked={
                          availabilitySettings.takeoutEnabled
                        }
                        onCheckedChange={(checked) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            takeoutEnabled: checked,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="prepTime"
                        className="text-slate-200"
                      >
                        Preparation Time (minutes)
                      </Label>
                      <Input
                        id="prepTime"
                        type="number"
                        value={
                          availabilitySettings.takeoutPreparationTime
                        }
                        onChange={(e) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            takeoutPreparationTime: parseInt(
                              e.target.value,
                            ),
                          })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                      <p className="text-xs text-slate-400">
                        Estimated time to prepare orders
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="orderMin"
                        className="text-slate-200"
                      >
                        Order Minimum ($)
                      </Label>
                      <Input
                        id="orderMin"
                        type="number"
                        value={
                          availabilitySettings.takeoutOrderMinimum
                        }
                        onChange={(e) =>
                          setAvailabilitySettings({
                            ...availabilitySettings,
                            takeoutOrderMinimum: parseInt(
                              e.target.value,
                            ),
                          })
                        }
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                      <p className="text-xs text-slate-400">
                        Minimum order amount for takeout
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
                <h3 className="text-lg sm:text-xl text-slate-100 mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "New Reservations",
                      desc: "Get notified of new bookings",
                    },
                    {
                      label: "New Takeout Orders",
                      desc: "Alert when new pickup orders arrive",
                    },
                    {
                      label: "Cancellations",
                      desc: "Alert when guests cancel",
                    },
                    {
                      label: "Waitlist Updates",
                      desc: "Notifications for waitlist changes",
                    },
                    {
                      label: "Review Alerts",
                      desc: "New customer reviews",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <div className="text-slate-200">
                          {item.label}
                        </div>
                        <p className="text-sm text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Reservation Detail Dialog */}
        <Dialog
          open={!!selectedReservation}
          onOpenChange={() => setSelectedReservation(null)}
        >
          <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                {selectedReservation?.guestName}
                {(selectedReservation as Reservation)?.vip && (
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedReservation?.id.startsWith("wait-")
                  ? "Waitlist Guest Details"
                  : "Reservation Details"}
              </DialogDescription>
            </DialogHeader>

            {selectedReservation && (
              <div className="space-y-6 py-4">
                {/* Guest Information */}
                <div className="space-y-3">
                  <h3 className="text-sm text-slate-300">
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Name
                      </p>
                      <p className="text-slate-100">
                        {selectedReservation.guestName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Party Size
                      </p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <p className="text-slate-100">
                          {selectedReservation.partySize} guests
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Phone
                      </p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <p className="text-slate-100">
                          {selectedReservation.phone}
                        </p>
                      </div>
                    </div>
                    {(selectedReservation as Reservation)
                      .email && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Email
                        </p>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <p className="text-slate-100 text-sm truncate">
                            {
                              (
                                selectedReservation as Reservation
                              ).email
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="space-y-3">
                  <h3 className="text-sm text-slate-300">
                    Reservation Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        {selectedReservation.id.startsWith("wait-") ? "Added At" : "Time"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <p className="text-slate-100">
                          {new Date(
                            selectedReservation.id.startsWith("wait-")
                              ? (selectedReservation as WaitlistGuest).addedAt
                              : (selectedReservation as Reservation).time,
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Date
                      </p>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-cyan-400" />
                        <p className="text-slate-100">
                          {new Date(
                            selectedReservation.id.startsWith("wait-")
                              ? (selectedReservation as WaitlistGuest).addedAt
                              : (selectedReservation as Reservation).time,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {(selectedReservation as Reservation)
                      .status && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Status
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            (selectedReservation as Reservation)
                              .status === "seated"
                              ? "border-green-500/30 text-green-400"
                              : (
                                    selectedReservation as Reservation
                                  ).status === "completed"
                                ? "border-slate-500/30 text-slate-400"
                                : "border-blue-500/30 text-blue-400"
                          }
                        >
                          {
                            (selectedReservation as Reservation)
                              .status
                          }
                        </Badge>
                      </div>
                    )}
                    {(selectedReservation as Reservation)
                      .tableId && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Table Assignment
                        </p>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Table{" "}
                          {(
                            selectedReservation as Reservation
                          ).tableId?.replace("t-", "") || "?"}
                        </Badge>
                      </div>
                    )}
                    {(selectedReservation as WaitlistGuest)
                      .estimatedWait && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Estimated Wait
                        </p>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-yellow-400" />
                          <p className="text-slate-100">
                            {
                              (
                                selectedReservation as WaitlistGuest
                              ).estimatedWait
                            }{" "}
                            minutes
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Notes */}
                {(selectedReservation as Reservation).notes && (
                  <div className="space-y-3">
                    <h3 className="text-sm text-slate-300">
                      Special Requests
                    </h3>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-slate-100 text-sm">
                        {
                          (selectedReservation as Reservation)
                            .notes
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                  {selectedReservation.id.startsWith(
                    "wait-",
                  ) ? (
                    <>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" />
                        Seat Guest
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Guest
                      </Button>
                    </>
                  ) : (selectedReservation as Reservation)
                      .status === "waiting" ? (
                    <>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" />
                        Seat Now
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  ) : (selectedReservation as Reservation)
                      .status === "seated" ? (
                    <>
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Check className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Floor Dialog */}
        <Dialog
          open={isFloorDialogOpen}
          onOpenChange={setIsFloorDialogOpen}
        >
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
            <DialogHeader>
              <DialogTitle>
                {editingFloor ? "Edit Floor" : "Add New Floor"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingFloor
                  ? "Update the floor name"
                  : "Create a new floor area for your restaurant"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="floorName"
                  className="text-slate-200"
                >
                  Floor Name
                </Label>
                <Input
                  id="floorName"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  placeholder="e.g. Main Dining Room, Patio, Second Floor"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsFloorDialogOpen(false);
                  setEditingFloor(null);
                  setFloorName("");
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFloor}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingFloor ? "Update Floor" : "Add Floor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Menu Item Dialog */}
        <Dialog
          open={isMenuDialogOpen}
          onOpenChange={setIsMenuDialogOpen}
        >
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedMenuItem?.id
                  ? "Edit Menu Item"
                  : "Add Menu Item"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedMenuItem?.id
                  ? "Update the details of this menu item"
                  : "Add a new item to your menu"}
              </DialogDescription>
            </DialogHeader>

            {selectedMenuItem && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="itemName"
                      className="text-slate-200"
                    >
                      Item Name
                    </Label>
                    <Input
                      id="itemName"
                      value={selectedMenuItem.name}
                      onChange={(e) =>
                        setSelectedMenuItem({
                          ...selectedMenuItem,
                          name: e.target.value,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="itemPrice"
                      className="text-slate-200"
                    >
                      Price ($)
                    </Label>
                    <Input
                      id="itemPrice"
                      type="number"
                      step="0.01"
                      value={selectedMenuItem.price}
                      onChange={(e) =>
                        setSelectedMenuItem({
                          ...selectedMenuItem,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="itemDesc"
                    className="text-slate-200"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="itemDesc"
                    value={selectedMenuItem.description}
                    onChange={(e) =>
                      setSelectedMenuItem({
                        ...selectedMenuItem,
                        description: e.target.value,
                      })
                    }
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="itemCategory"
                    className="text-slate-200"
                  >
                    Category
                  </Label>
                  <Select
                    value={selectedMenuItem.category}
                    onValueChange={(value) =>
                      setSelectedMenuItem({
                        ...selectedMenuItem,
                        category: value,
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {menuCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <Label className="text-slate-200">
                      Available
                    </Label>
                    <p className="text-sm text-slate-400">
                      Item is currently available
                    </p>
                  </div>
                  <Switch
                    checked={selectedMenuItem.available}
                    onCheckedChange={(checked) =>
                      setSelectedMenuItem({
                        ...selectedMenuItem,
                        available: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <Label className="text-slate-200">
                      Takeout Available
                    </Label>
                    <p className="text-sm text-slate-400">
                      Allow for pickup orders
                    </p>
                  </div>
                  <Switch
                    checked={selectedMenuItem.takeoutAvailable}
                    onCheckedChange={(checked) =>
                      setSelectedMenuItem({
                        ...selectedMenuItem,
                        takeoutAvailable: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <Label className="text-slate-200">
                      Popular Item
                    </Label>
                    <p className="text-sm text-slate-400">
                      Mark as customer favorite
                    </p>
                  </div>
                  <Switch
                    checked={selectedMenuItem.popular}
                    onCheckedChange={(checked) =>
                      setSelectedMenuItem({
                        ...selectedMenuItem,
                        popular: checked,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMenuDialogOpen(false);
                  setSelectedMenuItem(null);
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMenuItem}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}