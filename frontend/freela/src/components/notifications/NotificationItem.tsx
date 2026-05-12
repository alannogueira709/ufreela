'use client';

import { Notification, NotificationType } from '@/types/notification';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2,
  XCircle,
  MessageCircle,
  Banknote,
  Briefcase,
  Eye,
  Star,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const iconConfig: Record<NotificationType, { icon: React.ReactNode; bg: string }> = {
  proposal_accepted: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, bg: 'bg-emerald-100' },
  proposal_rejected: { icon: <XCircle className="h-4 w-4 text-red-500" />,          bg: 'bg-red-100' },
  new_message:       { icon: <MessageCircle className="h-4 w-4 text-blue-600" />,   bg: 'bg-blue-100' },
  payment_received:  { icon: <Banknote className="h-4 w-4 text-violet-600" />,      bg: 'bg-violet-100' },
  job_invitation:    { icon: <Briefcase className="h-4 w-4 text-amber-600" />,      bg: 'bg-amber-100' },
  profile_view:      { icon: <Eye className="h-4 w-4 text-cyan-600" />,             bg: 'bg-cyan-100' },
  review_received:   { icon: <Star className="h-4 w-4 text-yellow-500" />,          bg: 'bg-yellow-100' },
  deadline_reminder: { icon: <Clock className="h-4 w-4 text-orange-600" />,         bg: 'bg-orange-100' },
};

export function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const { icon, bg } = iconConfig[notification.type];

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      role="listitem"
      onClick={() => !notification.read && onRead(notification.id)}
      className={cn(
        'group relative flex gap-3 px-4 py-3.5 transition-colors cursor-pointer',
        notification.read
          ? 'hover:bg-muted/50'
          : 'bg-blue-50/60 hover:bg-blue-50 border-l-2 border-blue-500 dark:bg-blue-950/30 dark:hover:bg-blue-950/50',
      )}
    >
      {/* Ícone */}
      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', bg)}>
        {icon}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', notification.read ? 'text-foreground' : 'font-medium text-foreground')}>
            {notification.title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
            {!notification.read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Não lida" />
            )}
          </div>
        </div>

        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {notification.message}
        </p>

        {notification.metadata?.amount && (
          <Badge variant="secondary" className="mt-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-50 border-0">
            R$ {notification.metadata.amount.toLocaleString('pt-BR')}
          </Badge>
        )}
      </div>

      {/* Botão deletar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        aria-label="Remover notificação"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
