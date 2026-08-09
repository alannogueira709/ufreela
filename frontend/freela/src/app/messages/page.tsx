'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquarePlus, Search } from 'lucide-react';
import { ChatWindow } from '@/components/messages/MessageChat';
import { chatService } from '@/lib/api';
import { Conversation, Message as ChatMessage, User } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getMyFreelancerProposals } from '@/lib/proposal-service';
import { OpportunityPublisher } from '@/types/opportunity';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/lib/avatar';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isLoading: isAuthLoading } = useAuth();
  const currentUserId = user?.id?.toString() ?? '';
  const [isLoading, setIsLoading] = useState(true);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [eligiblePublishers, setEligiblePublishers] = useState<OpportunityPublisher[]>([]);
  const [isLoadingPublishers, setIsLoadingPublishers] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations();
      const loadedConversations = response.data as Conversation[];
      setConversations(loadedConversations);
      setConversationId((currentId) => {
        if (currentId && loadedConversations.some((conversation) => conversation.id === currentId)) {
          return currentId;
        }
        return loadedConversations[0]?.id ?? null;
      });
    } catch (error) {
      console.error('Não foi possível carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      void loadConversations();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user?.id, isAuthLoading, loadConversations]);

  useEffect(() => {
    if (!conversationId) return;

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread_count: 0 }
          : conversation
      )
    );
    void chatService.markAsRead(conversationId).catch((error) => {
      console.error('Não foi possível marcar a conversa como lida:', error);
    });
  }, [conversationId]);

  const loadEligiblePublishers = async () => {
    setIsLoadingPublishers(true);
    try {
      const proposals = await getMyFreelancerProposals();
      const activeProposals = proposals.filter(
        (proposal) => proposal.status === 'pending' || proposal.status === 'accepted'
      );
      const publishersMap = new Map<string, OpportunityPublisher>();

      activeProposals.forEach((proposal) => {
        const publisher = proposal.opportunity?.publisher;
        if (publisher && !publishersMap.has(publisher.id)) {
          publishersMap.set(publisher.id, publisher);
        }
      });

      setEligiblePublishers(Array.from(publishersMap.values()));
    } catch (error) {
      console.error('Não foi possível carregar publishers:', error);
    } finally {
      setIsLoadingPublishers(false);
    }
  };

  const handleStartConversation = async (publisherId: string) => {
    try {
      const response = await chatService.createConversation(publisherId);
      const newConversationId = response.data.id;
      await loadConversations();
      setConversationId(newConversationId);
      setIsNewChatOpen(false);
    } catch (error) {
      console.error('Não foi possível iniciar a conversa:', error);
    }
  };

  const handleMessageUpdate = useCallback(
    (message: ChatMessage) => {
      setConversations((previous) => {
        const conversation = previous.find((item) => item.id === conversationId);
        if (!conversation) return previous;

        const updatedConversation = {
          ...conversation,
          last_message: message,
          updated_at: message.timestamp,
          unread_count: 0,
        };

        return [
          updatedConversation,
          ...previous.filter((item) => item.id !== conversationId),
        ];
      });
    },
    [conversationId]
  );

  const getOtherUser = (conversation: Conversation): User =>
    String(conversation.user1.id) === currentUserId ? conversation.user2 : conversation.user1;

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = getOtherUser(conversation);
    const name = `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.username;
    const lastMessage = conversation.last_message;
    const preview = `${lastMessage?.content || ''} ${lastMessage?.attachment_name || ''}`;
    const searchableText = `${name} ${otherUser.email || ''} ${preview}`.toLocaleLowerCase();

    return searchableText.includes(searchQuery.trim().toLocaleLowerCase());
  });

  const selectedConversation = conversations.find((conversation) => conversation.id === conversationId);

  return (
    <div className="flex h-[calc(100vh-73px)] w-full overflow-hidden bg-white">
      <div
        className={`${conversationId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r bg-slate-50 md:w-80`}
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Conversas</h2>
              <p className="mt-0.5 text-xs text-slate-500">Mensagens com seus contatos</p>
            </div>

            <Dialog
              open={isNewChatOpen}
              onOpenChange={(open) => {
                setIsNewChatOpen(open);
                if (open) void loadEligiblePublishers();
              }}
            >
              <DialogTrigger
                className="rounded-md border bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:text-blue-600"
                title="Nova conversa"
              >
                <MessageSquarePlus size={18} />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Nova conversa</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex max-h-[300px] flex-col gap-2 overflow-y-auto">
                  <p className="mb-2 text-sm text-slate-500">
                    Inicie uma conversa com publishers em que você tenha propostas ativas ou contratos.
                  </p>

                  {isLoadingPublishers ? (
                    <div className="p-4 text-center text-sm text-slate-500">Carregando publishers...</div>
                  ) : eligiblePublishers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Nenhum publisher disponível no momento.
                    </div>
                  ) : (
                    eligiblePublishers.map((publisher) => (
                      <button
                        key={publisher.id}
                        type="button"
                        onClick={() => void handleStartConversation(publisher.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                          {publisher.company_name?.substring(0, 2).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <span className="block font-medium text-slate-900">
                            {publisher.company_name || 'Publisher'}
                          </span>
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
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full rounded-md border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Carregando conversas...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {searchQuery ? 'Nenhuma conversa corresponde à busca.' : 'Nenhuma conversa encontrada.'}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const lastMessage = conversation.last_message;
              const name = `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.username;
              const initials = name.substring(0, 2).toUpperCase();
              const avatarUrl = getAvatarUrl(otherUser.email, otherUser.profile_img || otherUser.avatar_url);
              const lastMessagePreview = lastMessage?.content?.trim()
                ? lastMessage.content
                : lastMessage?.attachment_name
                  ? `Anexo: ${lastMessage.attachment_name}`
                  : 'Sem mensagens...';

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setConversationId(conversation.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    conversationId === conversation.id
                      ? 'border-blue-200 bg-blue-50 shadow-sm'
                      : 'border-transparent hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-11 w-11 shrink-0 bg-blue-100 text-blue-600">
                      <AvatarImage
                        src={avatarUrl ?? undefined}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate pr-2 text-sm font-semibold text-slate-900">{name}</span>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {formatTime(lastMessage?.timestamp || conversation.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-xs ${
                            conversationId === conversation.id
                              ? 'font-medium text-blue-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {lastMessage?.sender.id.toString() === currentUserId ? 'Você: ' : ''}
                          {lastMessagePreview}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="flex-shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`${conversationId ? 'flex' : 'hidden md:flex'} relative min-w-0 flex-1 flex-col bg-white`}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          {conversationId ? (
            <ChatWindow
              conversationId={conversationId}
              currentUserId={currentUserId}
              otherUser={selectedConversation ? getOtherUser(selectedConversation) : null}
              onBack={() => setConversationId(null)}
              onMessage={handleMessageUpdate}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Selecione uma conversa para começar a conversar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
