import { useEffect, useRef, useState, useCallback, type SetStateAction } from 'react';
import { Message } from '@/types/chat';

export const useChatSocket = (conversationId: number | null) => {
  const [messageState, setMessageState] = useState<{
    conversationId: number | null;
    messages: Message[];
  }>({ conversationId: null, messages: [] });
  const [connectionState, setConnectionState] = useState<{
    conversationId: number | null;
    connected: boolean;
  }>({ conversationId: null, connected: false });
  const ws = useRef<WebSocket | null>(null);

  const messages = messageState.conversationId === conversationId ? messageState.messages : [];
  const isConnected =
    connectionState.conversationId === conversationId && connectionState.connected;

  const setMessages = useCallback(
    (update: SetStateAction<Message[]>) => {
      setMessageState((previous) => {
        const currentMessages =
          previous.conversationId === conversationId ? previous.messages : [];
        const nextMessages =
          typeof update === 'function' ? update(currentMessages) : update;

        return { conversationId, messages: nextMessages };
      });
    },
    [conversationId]
  );

  useEffect(() => {
    if (!conversationId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/chat/${conversationId}/`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () =>
      setConnectionState({ conversationId, connected: true });
    socket.onclose = () =>
      setConnectionState({ conversationId, connected: false });
    socket.onerror = (error) => console.error('WebSocket error:', error);

    socket.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);
      setMessages((prev) =>
        prev.some((message) => message.id === data.id) ? prev : [...prev, data]
      );
    };

    return () => {
      socket.close();
      if (ws.current === socket) {
        ws.current = null;
      }
    };
  }, [conversationId, setMessages]);

  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: content }));
    }
  }, []);

  return { messages, isConnected, sendMessage, setMessages };
};
