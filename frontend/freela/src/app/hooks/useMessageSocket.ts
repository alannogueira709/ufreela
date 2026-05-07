import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/types/chat';

export const useChatSocket = (conversationId: number | null, token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!conversationId || !token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/chat/${conversationId}/?token=${token}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = (error) => console.error('WebSocket error:', error);

    ws.current.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => {
      ws.current?.close();
    };
  }, [conversationId, token]);

  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: content }));
    }
  }, []);

  return { messages, isConnected, sendMessage, setMessages };
};