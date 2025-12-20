import { useState } from 'react';
import { Logo } from '@/components/shared/Logo';
import { useConfig } from '@/contexts/ConfigContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ClientMenu } from '@/components/client/ClientMenu';
import { ProductCard } from '@/components/client/ProductCard';
import { CategoryNav } from '@/components/client/CategoryNav';
import { Cart } from '@/components/client/Cart';
import { Checkout } from '@/components/client/Checkout';
import { OrderTracking } from '@/components/client/OrderTracking';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { mockCategories, mockProducts } from '@/data/mockProducts';
import { Order } from '@/types';
import { 
  Menu, 
  ShoppingBag, 
  Star, 
  Clock, 
  Truck, 
  MapPin,
  Store,
  ChevronRight
} from 'lucide-react';

export default function ClientPanel() {
  const { config } = useConfig();
  const { getItemCount, getSubtotal, setIsCartOpen } = useCart();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  const filteredProducts = activeCategory === 'all' 
    ? mockProducts.filter(p => p.isAvailable)
    : mockProducts.filter(p => p.categoryId === activeCategory && p.isAvailable);

  const productCounts = mockCategories.reduce((acc, cat) => {
    acc[cat.id] = mockProducts.filter(p => p.categoryId === cat.id && p.isAvailable).length;
    return acc;
  }, {} as Record<string, number>);

  const groupedProducts = activeCategory === 'all'
    ? mockCategories.filter(c => c.isActive).map(cat => ({
        category: cat,
        products: mockProducts.filter(p => p.categoryId === cat.id && p.isAvailable)
      })).filter(g => g.products.length > 0)
    : [{ 
        category: mockCategories.find(c => c.id === activeCategory)!, 
        products: filteredProducts 
      }];

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderPlaced = (order: Order) => {
    setIsCheckoutOpen(false);
    setCurrentOrder(order);
    setIsTrackingOpen(true);
  };

  const handleMenuNavigate = (page: string) => {
    if (page === 'tracking' && currentOrder) {
      setIsTrackingOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 gradient-radial-subtle" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Button 
                onClick={() => setIsCartOpen(true)}
                className="bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Carrinho
                {itemCount > 0 && (
                  <span className="ml-2 bg-primary-foreground/20 px-2 py-0.5 rounded text-xs font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-8 px-4 md:px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
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
          categories={mockCategories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          productCounts={productCounts}
        />

        {/* Products */}
        <section className="px-4 md:px-6 py-8 pb-32">
          <div className="max-w-4xl mx-auto space-y-8">
            {groupedProducts.map(({ category, products }) => (
              <div key={category.id} id={`category-${category.id}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <span className="text-sm text-muted-foreground">({products.length})</span>
                </div>
                <div className="space-y-3">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
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
