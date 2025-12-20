import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { useConfig } from '@/contexts/ConfigContext';
import { useProducts } from '@/contexts/ProductContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientOrders } from '@/hooks/useClientOrders';
import { Button } from '@/components/ui/button';
import { ClientMenu } from '@/components/client/ClientMenu';
import { ProductCard } from '@/components/client/ProductCard';
import { CategoryNav } from '@/components/client/CategoryNav';
import { Cart } from '@/components/client/Cart';
import { Checkout } from '@/components/client/Checkout';
import { OrderTracking } from '@/components/client/OrderTracking';
import { HeroBanner } from '@/components/client/HeroBanner';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { LoadingState } from '@/components/shared/LoadingState';
import { Order } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  ShoppingBag, 
  Star, 
  Clock, 
  Truck, 
  MapPin,
  Store,
  ChevronRight,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Settings
} from 'lucide-react';

export default function ClientPanel() {
  const navigate = useNavigate();
  const { config, isLoading: configLoading } = useConfig();
  const { products, categories, isLoading: productsLoading } = useProducts();
  const { getItemCount, getSubtotal, setIsCartOpen } = useCart();
  const { user, profile, signOut } = useAuth();
  const { orders: clientOrders } = useClientOrders(user?.id);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Get the current order from realtime data
  const currentOrder = currentOrderId 
    ? clientOrders.find(o => o.id === currentOrderId) || null 
    : clientOrders[0] || null;

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  // Use real products from context
  const availableProducts = products.filter(p => p.isAvailable);
  const activeCategories = categories.filter(c => c.isActive);

  const filteredProducts = activeCategory === 'all' 
    ? availableProducts
    : availableProducts.filter(p => p.categoryId === activeCategory);

  const productCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = availableProducts.filter(p => p.categoryId === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  const groupedProducts = activeCategory === 'all'
    ? activeCategories.map(cat => ({
        category: cat,
        products: availableProducts.filter(p => p.categoryId === cat.id)
      })).filter(g => g.products.length > 0)
    : [{ 
        category: categories.find(c => c.id === activeCategory)!, 
        products: filteredProducts 
      }].filter(g => g.category);

  const handleCheckout = () => {
    if (!user) {
      // Save pending checkout intent
      localStorage.setItem('pendingCheckout', 'true');
      navigate('/auth?tab=login');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderPlaced = (order: Order) => {
    setIsCheckoutOpen(false);
    setCurrentOrderId(order.id);
    setIsTrackingOpen(true);
  };

  const handleMenuNavigate = (page: string) => {
    switch (page) {
      case 'tracking':
        if (currentOrder) {
          setIsTrackingOpen(true);
        }
        break;
      case 'orders':
        navigate('/orders');
        break;
      case 'addresses':
        navigate('/addresses');
        break;
      case 'settings':
        navigate('/settings');
        break;
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isLoading = configLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Carregando cardápio..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 gradient-radial-subtle" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-3">
              {user && (
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              
              {/* Auth Buttons */}
              {!user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth?tab=login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Entrar
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth?tab=signup">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar
                    </Link>
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {profile?.name || 'Usuário'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsMenuOpen(true)}>
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsMenuOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile auth button */}
              {!user && (
                <Button variant="outline" size="icon" className="sm:hidden" asChild>
                  <Link to="/auth">
                    <LogIn className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Button 
                onClick={() => setIsCartOpen(true)}
                className="bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Carrinho</span>
                {itemCount > 0 && (
                  <span className="ml-2 bg-primary-foreground/20 px-2 py-0.5 rounded text-xs font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-8 px-4 md:px-6 border-b border-border">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Banner */}
            <HeroBanner />
            
            {/* Store Info */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-20 w-20 rounded-xl bg-primary flex items-center justify-center shadow-glow-gold">
                <Store className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{config.establishment.name}</h1>
                  {config.establishment.isOpen ? (
                    <span className="px-2.5 py-1 rounded-md bg-accent/15 text-accent text-xs font-medium">Aberto</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-medium">Fechado</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />)}</div>
                    <span className="font-medium text-foreground">4.9</span>
                    <span>(1.2k)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{config.establishment.estimatedDeliveryTime} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    <span className="text-accent font-medium">R$ {config.establishment.deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{config.establishment.address}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <CategoryNav 
          categories={activeCategories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          productCounts={productCounts}
        />

        {/* Products */}
        <section className="px-4 md:px-6 py-8 pb-32">
          <div className="max-w-4xl mx-auto space-y-8">
            {groupedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
              </div>
            ) : (
              groupedProducts.map(({ category, products: prods }) => (
                <div key={category.id} id={`category-${category.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{category.icon}</span>
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    <span className="text-sm text-muted-foreground">({prods.length})</span>
                  </div>
                  <div className="space-y-3">
                    {prods.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bottom Cart Bar */}
        {itemCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm p-4 z-50 animate-slide-up">
            <div className="max-w-4xl mx-auto">
              <Button 
                onClick={() => setIsCartOpen(true)}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver Carrinho ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                <span className="ml-auto font-bold font-mono">R$ {subtotal.toFixed(2)}</span>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClientMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={handleMenuNavigate} />
      <Cart onCheckout={handleCheckout} />
      <Checkout isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} onOrderPlaced={handleOrderPlaced} />
      <OrderTracking isOpen={isTrackingOpen} onClose={() => setIsTrackingOpen(false)} order={currentOrder} />
    </div>
  );
}
