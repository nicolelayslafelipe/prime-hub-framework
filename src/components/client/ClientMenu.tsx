import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Truck, 
  LogOut,
  ChevronRight,
  Settings
} from 'lucide-react';

interface ClientMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'profile', label: 'Meu Perfil', icon: User, description: 'Dados pessoais e preferências' },
  { id: 'addresses', label: 'Meus Endereços', icon: MapPin, description: 'Gerenciar endereços de entrega' },
  { id: 'orders', label: 'Meus Pedidos', icon: ShoppingBag, description: 'Histórico de pedidos' },
  { id: 'tracking', label: 'Acompanhar Pedido', icon: Truck, description: 'Rastrear entrega em tempo real' },
];

export function ClientMenu({ isOpen, onClose, onNavigate }: ClientMenuProps) {
  const handleNavigation = (page: string) => {
    onNavigate(page);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-card border-border">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-lg font-semibold text-foreground">Olá, Cliente</SheetTitle>
              <p className="text-sm text-muted-foreground">cliente@email.com</p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>

        <Separator className="bg-border" />

        <div className="p-4 space-y-1">
          <button
            onClick={() => handleNavigation('settings')}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Configurações</p>
              <p className="text-xs text-muted-foreground">Notificações e preferências</p>
            </div>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleNavigation('logout')}
          >
            <LogOut className="h-5 w-5" />
            Sair da conta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
