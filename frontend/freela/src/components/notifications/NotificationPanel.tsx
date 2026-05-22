'use client';

import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/app/hooks/useNotifications';
import { NotificationFilter } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  triggerClassName?: string;
  showLabel?: boolean;
}

const FILTER_TABS: { label: string; value: NotificationFilter }[] = [
  { label: 'Todas',      value: 'all' },
  { label: 'Não lidas',  value: 'unread' },
  { label: 'Propostas',  value: 'proposals' },
  { label: 'Mensagens',  value: 'messages' },
  { label: 'Pagamentos', value: 'payments' },
];

export function NotificationPanel({ triggerClassName, showLabel = false }: NotificationPanelProps) {
  const {
    notifications,
    allNotifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  } = useNotifications();

  function tabUnreadCount(value: NotificationFilter): number {
    if (value === 'all') return 0;
    return allNotifications.filter((n) => {
      if (!n.read) {
        if (value === 'unread') return true;
        if (value === 'proposals') return ['proposal_accepted', 'proposal_rejected', 'job_invitation'].includes(n.type);
        if (value === 'messages') return n.type === 'new_message';
        if (value === 'payments') return n.type === 'payment_received';
      }
      return false;
    }).length;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative hidden rounded-full border border-white/35 bg-white/35 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/55 hover:text-slate-900 md:inline-flex',
            triggerClassName,
          )}
          aria-label="Notificações"
        >
          <Bell size={20} />
          {showLabel && <span>Notificações</span>}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] p-0 shadow-xl sm:w-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              className="h-7 w-7 text-muted-foreground"
              aria-label="Atualizar"
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 gap-1.5 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)}>
          <div className="px-3 py-2">
            <TabsList className="h-auto gap-1 bg-transparent p-0 flex-wrap">
              {FILTER_TABS.map((tab) => {
                const count = tabUnreadCount(tab.value);
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-7 gap-1.5 rounded-lg px-1.5 text-xs data-active:bg-foreground data-active:text-background data-active:shadow-none"
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                        filter === tab.value
                          ? 'bg-background/20 text-background'
                          : 'bg-blue-500 text-white',
                      )}>
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <Separator />

          {/* Notification List */}
          <ScrollArea className="h-100">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="ghost" size="sm" onClick={refresh} className="text-xs">
                  Tentar novamente
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhuma notificação</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {filter === 'unread' ? 'Você está em dia!' : 'Sem notificações aqui.'}
                </p>
              </div>
            ) : (
              <div role="list" className="divide-y divide-border/50">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={removeNotification}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        {!isLoading && notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                size="sm"
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
