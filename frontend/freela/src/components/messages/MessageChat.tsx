'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck, FileText, Paperclip, Send, X } from 'lucide-react';
import { useChatSocket } from '@/app/hooks/useMessageSocket';
import { chatService, getChatAttachmentUrl } from '@/lib/api';
import { Message as ChatMessage, User } from '@/types/chat';
import { getAvatarUrl } from '@/lib/avatar';
import { useFormDraft } from '@/lib/hooks/useFormDraft';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message, MessageAvatar, MessageContent, MessageFooter } from '@/components/ui/message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';

interface ChatWindowProps {
  conversationId: number;
  currentUserId: string;
  otherUser: User | null;
  onBack?: () => void;
  onMessage?: (message: ChatMessage) => void;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

function isAllowedAttachment(file: File) {
  return (
    (file.type.startsWith('image/') && file.type !== 'image/svg+xml') ||
    ALLOWED_ATTACHMENT_TYPES.has(file.type)
  );
}

function formatFileSize(size?: number | null) {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function decodeHtmlEntities(value: string) {
  if (typeof document === 'undefined') return value;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function cleanMessageContent(value: string) {
  // Remove tags created by older versions that stored local blob URLs.
  return decodeHtmlEntities(value)
    .replace(/\[ATTACHMENT:[\s\S]*?\]/g, '')
    .trim();
}

function getDateKey(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('pt-BR');
}

function formatDateLabel(timestamp: string) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  currentUserId,
  otherUser,
  onBack,
  onMessage,
}) => {
  const { messages, isConnected, sendMessage, setMessages } = useChatSocket(conversationId);
  const { data: draft, setData: setDraft } = useFormDraft<{ inputValue: string }>({
    key: `ufreela:chat-${conversationId}`,
    initial: { inputValue: '' },
    storage: 'sessionStorage',
  });
  const [inputValue, setInputValue] = useState(draft.inputValue || '');
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    setDraft({ inputValue });
  }, [inputValue, setDraft]);

  useEffect(() => {
    setInputValue(draft.inputValue || '');
  }, [draft.inputValue]);

  useEffect(() => {
    setVisibleCount(20);
    prevMessagesLength.current = 0;
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const response = await chatService.getMessages(conversationId);
        if (!cancelled) {
          setMessages((previous) => {
            const messagesById = new Map<number, ChatMessage>(
              (response.data as ChatMessage[]).map((message): [number, ChatMessage] => [
                message.id,
                message,
              ])
            );

            previous.forEach((message) => messagesById.set(message.id, message));
            return Array.from(messagesById.values()).sort(
              (first, second) =>
                new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime()
            );
          });
        }
      } catch (error) {
        console.error('Não foi possível carregar mensagens:', error);
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [conversationId, setMessages]);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    void chatService.markAsRead(conversationId).catch((error) => {
      console.error('Não foi possível marcar mensagens como lidas:', error);
    });
  }, [conversationId]);

  const lastMessageId = messages[messages.length - 1]?.id;
  const lastMessageSenderId = messages[messages.length - 1]?.sender.id;

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessageId || !lastMessage) return;

    onMessage?.(lastMessage);

    if (String(lastMessageSenderId) !== String(currentUserId)) {
      void chatService.markAsRead(conversationId).catch((error) => {
        console.error('Não foi possível marcar mensagem como lida:', error);
      });
    }
  }, [conversationId, currentUserId, lastMessageId, lastMessageSenderId, messages, onMessage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const validFiles: File[] = [];
    let errorMessage = '';

    Array.from(event.target.files).forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        errorMessage = 'O tamanho máximo por arquivo é de 10 MB.';
      } else if (!isAllowedAttachment(file)) {
        errorMessage = 'Esse tipo de arquivo não é permitido.';
      } else {
        validFiles.push(file);
      }
    });

    setPendingAttachments((previous) => [...previous, ...validFiles]);
    setFileError(errorMessage || null);
    event.target.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const content = inputValue.trim();
    if (!content && pendingAttachments.length === 0) return;

    setFileError(null);

    if (pendingAttachments.length === 0) {
      if (!isConnected) {
        setFileError('A conexão ainda não está pronta. Tente novamente em instantes.');
        return;
      }

      sendMessage(content);
      setInputValue('');
      return;
    }

    setIsUploading(true);
    let uploadedAny = false;

    try {
      for (const [index, file] of pendingAttachments.entries()) {
        const response = await chatService.uploadAttachment(
          conversationId,
          file,
          index === 0 ? content : ''
        );
        const uploadedMessage = response.data as ChatMessage;

        setMessages((previous) =>
          previous.some((message) => message.id === uploadedMessage.id)
            ? previous
            : [...previous, uploadedMessage]
        );
        setPendingAttachments((previous) => previous.filter((item) => item !== file));
        uploadedAny = true;
      }

      setInputValue('');
    } catch (error) {
      console.error('Não foi possível enviar o anexo:', error);
      setFileError('Não foi possível enviar o anexo. Tente novamente.');
      if (uploadedAny) setInputValue('');
    } finally {
      setIsUploading(false);
    }
  };

  const contactName = otherUser
    ? `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.username
    : 'Usuário';
  const avatarUrl = otherUser
    ? getAvatarUrl(otherUser.email, otherUser.profile_img || otherUser.avatar_url)
    : null;
  const initials = contactName.substring(0, 2).toUpperCase();
  const visibleMessages = messages.slice(-visibleCount);

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 p-4 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
              aria-label="Voltar para conversas"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Avatar className="h-10 w-10 shrink-0 bg-slate-200 text-slate-600">
            <AvatarImage
              src={avatarUrl ?? undefined}
              alt={contactName}
              className="h-full w-full object-cover"
            />
            <AvatarFallback className="bg-slate-200 text-slate-600">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight text-slate-900">{contactName}</h3>
            <span className="text-[11px] text-slate-500">Conversa privada</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length > visibleCount && (
          <div className="mb-5 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((previous) => previous + 20)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              Carregar mensagens anteriores
            </button>
          </div>
        )}

        {visibleMessages.map((message, index) => {
          const isCurrentUser = String(message.sender.id) === String(currentUserId);
          const previousMessage = visibleMessages[index - 1];
          const showDate =
            !previousMessage || getDateKey(previousMessage.timestamp) !== getDateKey(message.timestamp);
          const nextMessage = visibleMessages[index + 1];
          const showAvatar =
            !isCurrentUser && (!nextMessage || String(nextMessage.sender.id) !== String(message.sender.id));
          const senderAvatarUrl = getAvatarUrl(
            message.sender.email,
            message.sender.profile_img || message.sender.avatar_url
          );
          const senderName =
            `${message.sender.first_name} ${message.sender.last_name}`.trim() || message.sender.username;
          const senderInitials = senderName.substring(0, 2).toUpperCase();
          const cleanContent = cleanMessageContent(message.content);
          const hasAttachment = Boolean(
            message.has_attachment || message.attachment_name
          );
          const attachmentName = message.attachment_name || 'Anexo';
          const attachmentUrl = getChatAttachmentUrl(message.id);
          const isImage = message.attachment_content_type?.startsWith('image/');

          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {formatDateLabel(message.timestamp)}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              )}

              <Message
                align={isCurrentUser ? 'end' : 'start'}
                className="mb-4"
              >
                {!isCurrentUser && (
                  <MessageAvatar className="bg-transparent">
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 bg-slate-200 text-slate-600">
                        <AvatarImage
                          src={senderAvatarUrl ?? undefined}
                          alt={senderName}
                          className="h-full w-full object-cover"
                        />
                        <AvatarFallback className="bg-slate-200 text-[10px] text-slate-600">
                          {senderInitials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8" />
                    )}
                  </MessageAvatar>
                )}

                <MessageContent>
                  <Bubble variant={isCurrentUser ? 'default' : 'outline'}>
                    <BubbleContent
                      className={isCurrentUser ? 'bg-slate-900 text-white' : 'bg-white'}
                    >
                      {cleanContent && (
                        <p className="whitespace-pre-wrap break-words">{cleanContent}</p>
                      )}

                      {hasAttachment && (
                        <Attachment
                          size="sm"
                          className={`mt-1 max-w-[min(80vw,22rem)] ${
                            isCurrentUser
                              ? 'border-slate-700 bg-slate-800 text-white'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <AttachmentMedia
                            variant={isImage ? 'image' : 'icon'}
                            className={isImage ? 'h-16 w-16' : ''}
                          >
                            {isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={attachmentUrl}
                                alt={attachmentName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileText
                                size={17}
                                className={isCurrentUser ? 'text-slate-200' : 'text-slate-500'}
                              />
                            )}
                          </AttachmentMedia>
                          <AttachmentContent>
                            <AttachmentTitle className={isCurrentUser ? 'text-white' : 'text-slate-700'}>
                              {attachmentName}
                            </AttachmentTitle>
                            <AttachmentDescription
                              className={isCurrentUser ? 'text-slate-300' : 'text-slate-500'}
                            >
                              {formatFileSize(message.attachment_size) || 'Arquivo'}
                            </AttachmentDescription>
                          </AttachmentContent>
                          <AttachmentActions>
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                isCurrentUser
                                  ? 'text-slate-200 hover:bg-slate-700 hover:text-white'
                                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
                              }`}
                            >
                              Abrir
                            </a>
                          </AttachmentActions>
                        </Attachment>
                      )}
                    </BubbleContent>
                  </Bubble>
                  <MessageFooter>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isCurrentUser && (
                      <span className="ml-1">
                        <CheckCheck
                          size={14}
                          className={message.is_read ? 'text-blue-500' : 'text-slate-300'}
                        />
                      </span>
                    )}
                  </MessageFooter>
                </MessageContent>
              </Message>
            </React.Fragment>
          );
        })}

        {messages.length === 0 && (
          <div className="mt-10 flex justify-center text-sm italic text-slate-400">
            Nenhuma mensagem enviada ainda.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200/80 bg-white/90 p-3 backdrop-blur-sm sm:p-4">
        {fileError && (
          <div className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-600">
            {fileError}
          </div>
        )}

        {pendingAttachments.length > 0 && (
          <AttachmentGroup className="mb-2">
            {pendingAttachments.map((file, index) => (
              <Attachment key={`${file.name}-${index}`} size="sm" className="bg-slate-50">
                <AttachmentMedia variant="icon">
                  <FileText size={16} className="text-slate-500" />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>{formatFileSize(file.size)}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 focus-within:border-slate-400 focus-within:bg-white"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label="Adicionar anexo"
          >
            <Paperclip size={19} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={2000}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={isUploading || (!inputValue.trim() && pendingAttachments.length === 0)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isUploading ? 'Enviando' : 'Enviar mensagem'}
          >
            <Send size={17} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
