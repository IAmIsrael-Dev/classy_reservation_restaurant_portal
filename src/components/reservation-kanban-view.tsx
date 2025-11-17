import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Users, Clock, Phone, AlertCircle, Calendar, Utensils, CheckCircle } from 'lucide-react';

type ReservationStatus = 'waiting' | 'seated' | 'completed';
type TableStatus = 'available' | 'reserved' | 'occupied' | 'cleaning';

interface Position {
  x: number;
  y: number;
}

interface FloorTable {
  id: string;
  number: number;
  floorId: string;
  capacity: number;
  status: TableStatus;
  position: Position;
  rotation?: number;
  reservationId?: string;
  serverId?: string;
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

interface ReservationKanbanViewProps {
  reservations: Reservation[];
  waitlist: WaitlistGuest[];
  tables: FloorTable[];
  onReservationClick: (reservation: Reservation | WaitlistGuest) => void;
}

export function ReservationKanbanView({ 
  reservations, 
  waitlist, 
  tables, 
  onReservationClick
}: ReservationKanbanViewProps) {
  const waitingReservations = reservations.filter(r => r.status === 'waiting');
  const seatedReservations = reservations.filter(r => r.status === 'seated');
  const completedReservations = reservations.filter(r => r.status === 'completed');

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'seated':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const renderReservationCard = (reservation: Reservation) => (
    <Card 
      key={reservation.id}
      className="p-4 bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
      onClick={() => onReservationClick(reservation)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-slate-100">{reservation.guestName}</h4>
            {reservation.vip && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                VIP
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-3 h-3" />
            <span>{reservation.partySize} guests</span>
          </div>
        </div>
        {reservation.tableId && (
          <Badge className={getStatusColor(reservation.status)}>
            Table {tables.find(t => t.id === reservation.tableId)?.number || reservation.tableId}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1 text-xs text-slate-400">
        {reservation.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{reservation.time}</span>
          </div>
        )}
        {reservation.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{reservation.phone}</span>
          </div>
        )}
        {reservation.notes && (
          <div className="flex items-center gap-1 text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            <span>{reservation.notes}</span>
          </div>
        )}
      </div>
    </Card>
  );

  const renderWaitlistCard = (guest: WaitlistGuest) => (
    <Card 
      key={guest.id}
      className="p-4 bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
      onClick={() => onReservationClick(guest)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-slate-100">{guest.guestName}</h4>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-3 h-3" />
            <span>{guest.partySize} guests</span>
          </div>
        </div>
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          {guest.estimatedWait}m
        </Badge>
      </div>
      
      <div className="space-y-1 text-xs text-slate-400">
        {guest.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{guest.phone}</span>
          </div>
        )}
        {guest.addedAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(guest.addedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </Card>
  );

  // Column component matching host console style
  const KanbanColumn = ({ 
    title, 
    icon, 
    guests, 
    badgeClass,
    emptyMessage 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    guests: (Reservation | WaitlistGuest)[]; 
    badgeClass: string;
    emptyMessage: string;
  }) => (
    <div className="flex-1 min-w-0">
      <div className="h-full rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-lg text-slate-100">{title}</h3>
            </div>
            <Badge variant="secondary" className={badgeClass}>
              {guests.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3 pr-4">
              {guests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>{emptyMessage}</p>
                </div>
              ) : (
                guests.map((guest) => 
                  'estimatedWait' in guest 
                    ? renderWaitlistCard(guest as WaitlistGuest)
                    : renderReservationCard(guest as Reservation)
                )
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <KanbanColumn
        title="Waitlist"
        icon={<Clock className="w-5 h-5 text-orange-400" />}
        guests={waitlist}
        badgeClass="bg-slate-700 text-slate-300"
        emptyMessage="No guests waiting"
      />
      
      <KanbanColumn
        title="Waiting"
        icon={<Calendar className="w-5 h-5 text-yellow-400" />}
        guests={waitingReservations}
        badgeClass="bg-slate-700 text-slate-300"
        emptyMessage="No waiting reservations"
      />
      
      <KanbanColumn
        title="Seated"
        icon={<Utensils className="w-5 h-5 text-blue-400" />}
        guests={seatedReservations}
        badgeClass="bg-slate-700 text-slate-300"
        emptyMessage="No seated guests"
      />
      
      <KanbanColumn
        title="Completed"
        icon={<CheckCircle className="w-5 h-5 text-green-400" />}
        guests={completedReservations}
        badgeClass="bg-slate-700 text-slate-300"
        emptyMessage="No completed reservations"
      />
    </div>
  );
}