'use client';

import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/messages/MessageChat';
import { Search, X, MessageSquarePlus } from 'lucide-react';
import Image from 'next/image';
import { chatService } from '@/lib/api';
import { Conversation, User } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getMyFreelancerProposals } from '@/lib/proposal-service';
import { OpportunityPublisher } from '@/types/opportunity';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // New chat modal states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [eligiblePublishers, setEligiblePublishers] = useState<OpportunityPublisher[]>([]);
  const [isLoadingPublishers, setIsLoadingPublishers] = useState(false);

  const loadConversations = async () => {
    try {
      const response = await chatService.getConversations();
      setConversations(response.data);
      if (response.data.length > 0 && !conversationId) {
        setConversationId(response.data[0].id);
      }
    } catch (error) {
      console.error('Não foi possível carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id.toString());
      loadConversations();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user?.id, isAuthLoading]);

  const loadEligiblePublishers = async () => {
    setIsLoadingPublishers(true);
    try {
      const proposals = await getMyFreelancerProposals();
      // Filter for active proposals/contracts
      const activeProposals = proposals.filter(p => p.status === 'pending' || p.status === 'accepted');
      
      // Extract unique publishers
      const publishersMap = new Map<string, OpportunityPublisher>();
      activeProposals.forEach(p => {
        if (p.opportunity && p.opportunity.publisher && !publishersMap.has(p.opportunity.publisher.id)) {
          publishersMap.set(p.opportunity.publisher.id, p.opportunity.publisher);
        }
      });
      
      setEligiblePublishers(Array.from(publishersMap.values()));
    } catch (error) {
      console.error('Failed to load eligible publishers:', error);
    } finally {
      setIsLoadingPublishers(false);
    }
  };

  const handleStartConversation = async (publisherId: string) => {
    try {
      // Create new conversation
      const response = await chatService.createConversation(publisherId);
      const newConvId = response.data.id;
      
      // Reload conversations and select the new one
      await loadConversations();
      setConversationId(newConvId);
      setIsNewChatOpen(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const getOtherUser = (conv: Conversation): User => {
    return conv.user1.id === currentUserId ? conv.user2 : conv.user1;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const selectedConversation = conversations.find(c => c.id === conversationId);

  return (
    <div className="flex h-[calc(100vh-73px)] w-full overflow-hidden bg-white">
      {/* Sidebar with conversations */}
      <div className="w-80 flex-shrink-0 border-r bg-[#f8fafc] flex flex-col">
        {/* Header */}
        <div className="p-4 flex flex-col gap-4 border-b border-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Conversas</h2>
            
            <Dialog open={isNewChatOpen} onOpenChange={(open) => {
              setIsNewChatOpen(open);
              if (open) loadEligiblePublishers();
            }}>
              <DialogTrigger
                className="text-slate-500 hover:text-blue-600 bg-white border shadow-sm p-1.5 rounded-md transition-colors"
                title="Nova Conversa"
              >
                <MessageSquarePlus size={18} />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                  <p className="text-sm text-slate-500 mb-2">
                    Inicie uma conversa com publishers em que você tenha propostas ativas ou contratos.
                  </p>
                  
                  {isLoadingPublishers ? (
                    <div className="p-4 text-center text-sm text-slate-500">Carregando publishers...</div>
                  ) : eligiblePublishers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">Nenhum publisher disponível no momento.</div>
                  ) : (
                    eligiblePublishers.map((pub) => (
                      <button
                        key={pub.id}
                        onClick={() => handleStartConversation(pub.id)}
                        className="flex items-center gap-3 p-3 text-left w-full hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {pub.company_name?.substring(0, 2).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 block">{pub.company_name || 'Publisher'}</span>
                          <span className="text-xs text-slate-500">Clique para iniciar conversa</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar conversas..." 
              className="w-full bg-white border-0 rounded-md py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Carregando conversas...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">Nenhuma conversa encontrada.</div>
          ) : (
            conversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              const lastMsg = conv.last_message;
              const name = `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.username;
              const initials = name.substring(0, 2).toUpperCase();
              // Fake online status for now, since we don't have presence yet
              const isOnline = Math.random() > 0.5;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setConversationId(conv.id)}
                  className={`w-full text-left flex gap-3 p-3 rounded-xl transition-all duration-200 ${
                    conversationId === conv.id 
                      ? 'bg-blue-50/50 border border-blue-500 shadow-sm' 
                      : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <Avatar className="h-12 w-12 bg-blue-100 text-blue-600">
                      <AvatarImage
                        src={otherUser.avatar_url ?? undefined}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-slate-900 text-sm truncate pr-2">{name}</span>
                      <span className="text-[11px] text-slate-500 flex-shrink-0">
                        {formatTime(lastMsg?.timestamp || conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate ${
                        conversationId === conv.id ? 'text-blue-600 font-medium' : 'text-slate-500'
                      }`}>
                        {lastMsg ? (
                          <>
                            {lastMsg.sender.id === currentUserId ? 'You: ' : ''}
                            {lastMsg.content}
                          </>
                        ) : (
                          <span className="italic">Sem mensagens...</span>
                        )}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Dotted Background Pattern */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
          style={{ 
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }}
        />
        
        <div className="relative z-10 flex flex-col h-full">
          {conversationId ? (
            <ChatWindow 
              conversationId={conversationId} 
              currentUserId={currentUserId}
              otherUser={selectedConversation ? getOtherUser(selectedConversation) : null}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Selecione uma conversa para começar a conversar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}