'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useChatSocket } from '@/app/hooks/useMessageSocket';
import { chatService } from '@/lib/api';
import { Message, User } from '@/types/chat';
import { Phone, Video, Info, Plus, Smile, Send, Lock, CheckCheck } from 'lucide-react';
import { getAvatarUrl } from '@/lib/avatar';
import { useFormDraft } from '@/lib/hooks/useFormDraft';

interface ChatWindowProps {
  conversationId: number;
  currentUserId: string;
  otherUser: User | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversationId, 
  currentUserId,
  otherUser
}) => {
  const { messages, isConnected, sendMessage, setMessages } = useChatSocket(conversationId);
  const { data: draft, setData: setDraft } = useFormDraft<{ inputValue: string }>({
    key: `ufreela:chat-${conversationId}`,
    initial: { inputValue: "" },
    storage: "sessionStorage",
  });
  const [inputValue, setInputValue] = useState(draft.inputValue || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Persiste o inputValue no rascunho
  useEffect(() => {
    setDraft({ inputValue });
  }, [inputValue, setDraft]);
  
  const [visibleCount, setVisibleCount] = useState(20);
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await chatService.getMessages(conversationId);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    loadHistory();
  }, [conversationId, setMessages]);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const contactName = otherUser ? `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.username : 'Unknown User';
  const avatarUrl = otherUser ? getAvatarUrl(otherUser.email, otherUser.profile_img || otherUser.avatar_url) : null;
  const initials = contactName.substring(0, 2).toUpperCase();
  
  const visibleMessages = messages.slice(-visibleCount);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-600 bg-slate-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt={contactName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{contactName}</h3>
            <span className="text-[10px] font-bold text-green-500 tracking-wider uppercase">ACTIVE NOW</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <button className="hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length > visibleCount && (
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => setVisibleCount(prev => prev + 20)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-3 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
            >
              Carregar mensagens anteriores
            </button>
          </div>
        )}

        {/* Date Separator */}
        <div className="flex justify-center my-4">
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {visibleMessages.map((msg, index) => {
          const isCurrentUser = msg.sender.id === currentUserId;
          const showAvatar = !isCurrentUser && (index === visibleMessages.length - 1 || visibleMessages[index + 1]?.sender.id === currentUserId);
          const msgSenderAvatarUrl = msg.sender ? getAvatarUrl(msg.sender.email, msg.sender.profile_img || msg.sender.avatar_url) : null;
          const msgSenderName = `${msg.sender.first_name} ${msg.sender.last_name}`.trim() || msg.sender.username;
          const msgSenderInitials = msgSenderName.substring(0, 2).toUpperCase();
          
          return (
            <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start gap-3'}`}>
              {!isCurrentUser && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto mb-5 flex items-center justify-center font-bold text-xs text-slate-600 bg-slate-200">
                  {showAvatar ? (
                    msgSenderAvatarUrl ? (
                      <img src={msgSenderAvatarUrl} alt={msgSenderName} className="w-full h-full object-cover" />
                    ) : (
                      msgSenderInitials
                    )
                  ) : (
                    <div className="w-full h-full" /> // Placeholder for alignment
                  )}
                </div>
              )}
              
              <div className={`flex flex-col gap-1 max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3.5 text-[15px] leading-relaxed ${
                  isCurrentUser 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                    : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-2xl rounded-bl-sm'
                }`}>
                  <p>{msg.content}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 px-1">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isCurrentUser && <CheckCheck size={14} className="text-blue-500" />}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Empty state or typing indicator placeholder */}
        {messages.length === 0 && (
          <div className="flex justify-center text-slate-400 italic text-sm mt-10">
             Nenhuma mensagem enviada ainda.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-[#f8fafc] border border-slate-200/60 rounded-full pl-2 pr-2 py-2 mb-3">
          <button type="button" className="p-2 text-slate-600 hover:text-slate-900 transition-colors hover:bg-slate-200 rounded-full">
            <Plus size={22} />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[15px] text-slate-700 placeholder:text-slate-500"
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:hover:bg-blue-600 ml-1 flex-shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};