import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  ArrowLeft,
  Send,
  User,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Shield,
  Building,
  MessageSquare,
} from 'lucide-react';
import { useConversations, useConversationMessages, useReservations } from '../lib/firebase-hooks';
import type { Conversation, ConversationMessage } from '../lib/firebase-service';
import { toast } from 'sonner';

interface MessagingChatProps {
  conversation: Conversation;
  userRole: 'RESTAURANT_MANAGER' | 'RESTAURANT_HOST';
  onBack: () => void;
}

export function MessagingChat({ conversation, userRole, onBack }: MessagingChatProps) {
  const { updateConversation } = useConversations();
  const { messages, createMessage } = useConversationMessages(conversation.id);
  const { reservations } = useReservations();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restaurantId = localStorage.getItem('currentRestaurantId') || 'demo-restaurant';

  // Find reservation if linked
  const linkedReservation = useMemo(() => {
    if (!conversation.reservationId || !reservations) return null;
    return reservations.find(r => r.id === conversation.reservationId);
  }, [conversation.reservationId, reservations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    try {
      // Create message
      await createMessage({
        senderId: restaurantId,
        senderRole: userRole,
        text: messageText.trim(),
        messageType: 'TEXT',
        createdAt: new Date().toISOString(),
        isRead: false,
      });

      // Update conversation with last message
      await updateConversation(conversation.id, {
        lastMessage: messageText.trim(),
        lastMessageAt: new Date().toISOString(),
      });

      setMessageText('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getSenderAvatar = (senderRole: ConversationMessage['senderRole']) => {
    switch (senderRole) {
      case 'USER':
        return { icon: User, color: 'bg-blue-500', text: 'Guest' };
      case 'RESTAURANT_MANAGER':
        return { icon: Building, color: 'bg-purple-500', text: 'Manager' };
      case 'RESTAURANT_HOST':
        return { icon: User, color: 'bg-green-500', text: 'Host' };
      case 'ADMIN':
        return { icon: Shield, color: 'bg-red-500', text: 'Admin' };
    }
  };

  const getConversationTitle = () => {
    if (conversation.type === 'ADMIN_RESTAURANT') {
      return 'Platform Admin';
    }
    if (linkedReservation) {
      return linkedReservation.guestName;
    }
    return 'Guest User';
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'ADMIN_RESTAURANT') {
      return 'System Message';
    }
    if (linkedReservation) {
      return `Reservation • ${linkedReservation.partySize} guests`;
    }
    return 'General Conversation';
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{getConversationTitle()}</h2>
              {conversation.type === 'ADMIN_RESTAURANT' && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 border">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-400">{getConversationSubtitle()}</p>
          </div>
        </div>

        {/* Linked Reservation Details */}
        {linkedReservation && (
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(linkedReservation.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {new Date(linkedReservation.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  {linkedReservation.partySize} guests
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Badge className={`${
                    linkedReservation.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    linkedReservation.status === 'seated' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    linkedReservation.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  } border text-xs`}>
                    {linkedReservation.status}
                  </Badge>
                </div>
              </div>
              
              <Separator className="my-3 bg-slate-700" />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span>{linkedReservation.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span>{linkedReservation.email}</span>
                </div>
              </div>

              {linkedReservation.notes && (
                <>
                  <Separator className="my-3 bg-slate-700" />
                  <div className="p-2 bg-slate-900/50 rounded text-xs">
                    <span className="text-slate-400 font-medium">Special Requests:</span>
                    <p className="text-slate-300 mt-1">{linkedReservation.notes}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No messages yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Start the conversation by sending a message below
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const avatar = getSenderAvatar(message.senderRole);
                const isRestaurant = message.senderRole === 'RESTAURANT_MANAGER' || message.senderRole === 'RESTAURANT_HOST';
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showDateDivider = !prevMessage || 
                  new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

                return (
                  <React.Fragment key={message.id}>
                    {showDateDivider && (
                      <div className="flex items-center gap-4 my-6">
                        <Separator className="flex-1 bg-slate-800" />
                        <span className="text-xs text-slate-500">
                          {formatDate(message.createdAt)}
                        </span>
                        <Separator className="flex-1 bg-slate-800" />
                      </div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${isRestaurant ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center flex-shrink-0`}>
                        <avatar.icon className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className={`flex-1 max-w-[70%] ${isRestaurant ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400">
                            {avatar.text}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          isRestaurant
                            ? message.senderRole === 'RESTAURANT_MANAGER'
                              ? 'bg-purple-600 text-white rounded-tr-sm'
                              : 'bg-green-600 text-white rounded-tr-sm'
                            : message.senderRole === 'ADMIN'
                            ? 'bg-red-600 text-white rounded-tl-sm'
                            : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        </div>
                        
                        {!message.isRead && !isRestaurant && (
                          <span className="text-xs text-blue-400 mt-1">Unread</span>
                        )}
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-6 border-t border-slate-800 bg-slate-900">
        <div className="flex gap-3">
          <Textarea
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {sending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}