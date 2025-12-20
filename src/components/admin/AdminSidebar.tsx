import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  FolderOpen,
  Package,
  ShoppingCart,
  Kanban,
  UserCircle,
  CreditCard,
  Wallet,
  Banknote,
  QrCode,
  Megaphone,
  Gift,
  Star,
  Clock,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Key,
  UserCog,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Operações',
    defaultOpen: true,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Kanban, label: 'Kanban', path: '/admin/kanban', badge: true },
      { icon: ShoppingBag, label: 'Pedidos', path: '/admin/orders' },
      { icon: UserCircle, label: 'Clientes', path: '/admin/clients' },
    ],
  },
  {
    title: 'Cardápio',
    defaultOpen: true,
    items: [
      { icon: FolderOpen, label: 'Categorias', path: '/admin/categories' },
      { icon: Package, label: 'Produtos', path: '/admin/products' },
      { icon: ShoppingCart, label: 'Itens Retirada', path: '/admin/pickup' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { icon: CreditCard, label: 'Pagamento Online', path: '/admin/online-payment' },
      { icon: Wallet, label: 'Mercado Pago', path: '/admin/mercadopago' },
      { icon: Banknote, label: 'Formas Pagamento', path: '/admin/payment-methods' },
      { icon: QrCode, label: 'Mensagens PIX', path: '/admin/pix-messages' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { icon: Megaphone, label: 'Banners', path: '/admin/marketing' },
      { icon: Gift, label: 'Fidelidade', path: '/admin/loyalty' },
      { icon: Star, label: 'Avaliações', path: '/admin/reviews' },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { icon: Settings, label: 'Sistema', path: '/admin/system' },
      { icon: Clock, label: 'Horários', path: '/admin/hours' },
      { icon: Truck, label: 'Entrega', path: '/admin/delivery-config' },
      { icon: MessageSquare, label: 'Mensagens', path: '/admin/messages' },
      { icon: ShieldCheck, label: 'Verificação', path: '/admin/verification' },
      { icon: ShieldAlert, label: 'reCAPTCHA', path: '/admin/recaptcha' },
      { icon: Key, label: 'API', path: '/admin/api-config' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { icon: UserCog, label: 'Usuários', path: '/admin/users' },
    ],
  },
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(
    menuGroups.filter(g => g.defaultOpen).map(g => g.title)
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { getPendingOrdersCount } = useOrders();
  const pendingCount = getPendingOrdersCount();

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border shrink-0">
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
        <div className="p-4 space-y-2 shrink-0">
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
      <ScrollArea className="flex-1 px-3">
        <nav className="py-4 space-y-2">
          {menuGroups.map((group) => (
            <Collapsible
              key={group.title}
              open={!isCollapsed && openGroups.includes(group.title)}
              onOpenChange={() => !isCollapsed && toggleGroup(group.title)}
            >
              {!isCollapsed && (
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                  <span>{group.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      openGroups.includes(group.title) && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
              )}
              <CollapsibleContent className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
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
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && pendingCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                              {pendingCount}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </CollapsibleContent>
              {isCollapsed && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center justify-center rounded-lg p-2.5 transition-all relative',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                        title={item.label}
                      >
                        <Icon className="h-5 w-5" />
                        {item.badge && pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            isCollapsed && 'justify-center px-2'
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 shrink-0">
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
    </aside>
  );
}
