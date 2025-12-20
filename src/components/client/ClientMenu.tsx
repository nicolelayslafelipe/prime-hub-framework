import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
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
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleNavigation = (page: string) => {
    if (page === 'profile') {
      navigate('/profile');
      onClose();
      return;
    }
    if (page === 'logout') {
      handleLogout();
      return;
    }
    onNavigate(page);
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-card border-border">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <SheetTitle className="text-lg font-semibold text-foreground">
                Olá, {profile?.name?.split(' ')[0] || 'Cliente'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
