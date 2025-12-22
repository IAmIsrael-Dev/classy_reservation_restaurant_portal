import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Search,
  User,
  Shield,
  ArrowRight,
  MessageCircle,
  Inbox,
} from 'lucide-react';
import { useConversations, useReservations } from '../lib/firebase-hooks';
import type { Conversation } from '../lib/firebase-service';

interface MessagingInboxProps {
  onSelectConversation: (conversation: Conversation) => void;
  userRole: 'RESTAURANT_MANAGER' | 'RESTAURANT_HOST';
}

export function MessagingInbox({ onSelectConversation }: MessagingInboxProps) {
  const { conversations, loading: conversationsLoading } = useConversations();
  const { reservations } = useReservations();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Create a map of reservationId to reservation for quick lookup
  const reservationMap = useMemo(() => {
    const map = new Map();
    if (reservations) {
      reservations.forEach(res => {
        map.set(res.id, res);
      });
    }
    return map;
  }, [reservations]);

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations ? [...conversations] : [];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    // Search by last message or reservation guest name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const matchesMessage = c.lastMessage.toLowerCase().includes(query);
        if (c.reservationId) {
          const reservation = reservationMap.get(c.reservationId);
          const matchesGuest = reservation?.guestName?.toLowerCase().includes(query);
          return matchesMessage || matchesGuest;
        }
        return matchesMessage;
      });
    }

    // Sort by most recent message
    filtered.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return filtered;
  }, [conversations, typeFilter, searchQuery, reservationMap]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.type === 'ADMIN_RESTAURANT') {
      return { icon: Shield, color: 'bg-red-500', label: 'Admin' };
    }
    return { icon: User, color: 'bg-blue-500', label: 'Guest' };
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'ADMIN_RESTAURANT') {
      return 'Platform Admin';
    }
    
    // If linked to reservation, show guest name
    if (conversation.reservationId) {
      const reservation = reservationMap.get(conversation.reservationId);
      if (reservation) {
        return reservation.guestName;
      }
    }
    
    // Fallback to showing participant info
    return conversation.participants.userId ? 'Guest User' : 'Unknown';
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.type === 'ADMIN_RESTAURANT') {
      return 'System Message';
    }
    
    if (conversation.reservationId) {
      const reservation = reservationMap.get(conversation.reservationId);
      if (reservation) {
        const date = new Date(reservation.time);
        return `Reservation • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
      }
    }
    
    return 'General Message';
  };

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Messages</h2>
            <p className="text-sm text-slate-400 mt-1">
              Communicate with guests and admins
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            {filteredConversations.length} {filteredConversations.length === 1 ? 'Conversation' : 'Conversations'}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 mt-4">
          {['all', 'USER_RESTAURANT', 'ADMIN_RESTAURANT'].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className={
                typeFilter === type
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
              }
            >
              {type === 'all' ? 'All' : type === 'USER_RESTAURANT' ? 'Guest Messages' : 'Admin Messages'}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredConversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No conversations yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery ? 'Try adjusting your search' : 'Messages will appear here when you receive them'}
                </p>
              </motion.div>
            ) : (
              filteredConversations.map((conversation, index) => {
                const icon = getConversationIcon(conversation);
                const title = getConversationTitle(conversation);
                const subtitle = getConversationSubtitle(conversation);

                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-full ${icon.color} flex items-center justify-center flex-shrink-0`}>
                            <icon.icon className="w-6 h-6 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                                  {title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {subtitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                  {formatTime(conversation.lastMessageAt)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                              </div>
                            </div>

                            <Separator className="my-2 bg-slate-800" />

                            {/* Last Message Preview */}
                            <div className="flex items-start justify-between">
                              <p className="text-sm text-slate-400 line-clamp-2 flex-1">
                                {conversation.lastMessage}
                              </p>
                              <MessageCircle className="w-4 h-4 text-blue-400 ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}