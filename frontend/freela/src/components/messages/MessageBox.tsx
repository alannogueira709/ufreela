'use client'

import React, { useEffect, useRef } from 'react';
import { useChatSocket } from '@/app/hooks/useMessageSocket';
import { chatService } from '@/lib/api';
import { Message } from '@/types/chat';

interface ChatWindowProps {
  conversationId: number;
  currentUserId: string;
  token: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversationId, 
  currentUserId,
  token 
}) => {
  const { messages, isConnected, sendMessage, setMessages } = useChatSocket(conversationId, token);
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega histórico inicial via REST
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

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold">Chat</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender.id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
              msg.sender.id === currentUserId 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              <p>{msg.content}</p>
              <span className="text-xs opacity-75">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!isConnected}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};