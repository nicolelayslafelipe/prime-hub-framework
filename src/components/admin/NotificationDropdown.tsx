import { useState } from 'react';
import { Bell, Check, CheckCheck, Package, CreditCard, XCircle, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminNotifications, AdminNotification } from '@/hooks/useAdminNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const notificationIcons: Record<AdminNotification['type'], React.ReactNode> = {
  new_order: <Package className="h-4 w-4 text-primary" />,
  order_paid: <CreditCard className="h-4 w-4 text-green-500" />,
  order_cancelled: <XCircle className="h-4 w-4 text-destructive" />,
  order_updated: <RefreshCw className="h-4 w-4 text-blue-500" />,
  system: <AlertCircle className="h-4 w-4 text-yellow-500" />,
};

const notificationColors: Record<AdminNotification['type'], string> = {
  new_order: 'bg-primary/10',
  order_paid: 'bg-green-500/10',
  order_cancelled: 'bg-destructive/10',
  order_updated: 'bg-blue-500/10',
  system: 'bg-yellow-500/10',
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useAdminNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.order_id) {
      navigate('/admin/orders');
      setOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border-border z-50">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 px-2 text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-3 cursor-pointer focus:bg-muted/50 group',
                  !notification.is_read && 'bg-muted/30'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={cn('p-2 rounded-full flex-shrink-0', notificationColors[notification.type])}>
                  {notificationIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium truncate', !notification.is_read && 'text-foreground')}>
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(e, notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
