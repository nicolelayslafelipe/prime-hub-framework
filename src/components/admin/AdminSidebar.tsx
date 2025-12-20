import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { useConfig } from '@/contexts/ConfigContext';
import { useOrders } from '@/contexts/OrderContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: ShoppingBag, label: 'Pedidos', path: '/admin/orders', hasBadge: true },
  { icon: Users, label: 'Usuários', path: '/admin/users' },
  { icon: Settings, label: 'Configurações', path: '/admin/settings' },
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { config } = useConfig();
  const { getPendingOrdersCount } = useOrders();
  const pendingCount = getPendingOrdersCount();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Logo size="sm" showText={!isCollapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status Cards */}
        {!isCollapsed && (
          <div className="p-4 space-y-2">
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm border',
                config.establishment.isOpen
                  ? 'bg-accent/10 border-accent/20 text-accent'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              )}
            >
              <Store className="h-4 w-4" />
              <span className="font-medium">
                {config.establishment.isOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm border',
                config.establishment.isDeliveryEnabled
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              <Truck className="h-4 w-4" />
              <span className="font-medium">
                {config.establishment.isDeliveryEnabled ? 'Delivery Ativo' : 'Delivery Pausado'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary ml-[-1px]'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.hasBadge && pendingCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin</p>
                <p className="text-xs text-muted-foreground truncate">admin@deliveryos.com</p>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-sm font-semibold text-primary">A</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
