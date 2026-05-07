'use client';

import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/messages/MessageBox';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(1);
  const [token, setToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    setToken(localStorage.getItem('access_token') || '');
    // TODO: decodificar o JWT para obter o ID real do usuário
    setCurrentUserId(localStorage.getItem('user_id') || '');
  }, []);

  return (
    <div className="container mx-auto h-screen p-4">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Sidebar com conversas */}
        <div className="col-span-4 border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Conversas</h2>
          {/* Liste conversas aqui via API */}
        </div>

        {/* Área do chat */}
        <div className="col-span-8 h-full">
          {conversationId ? (
            <ChatWindow 
              conversationId={conversationId} 
              currentUserId={currentUserId}
              token={token}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecione uma conversa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}