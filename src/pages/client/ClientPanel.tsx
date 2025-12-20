import { Logo } from '@/components/shared/Logo';
import { useConfig } from '@/contexts/ConfigContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Clock, 
  MapPin, 
  Phone, 
  ShoppingBag,
  ChevronRight,
  Star,
  Truck
} from 'lucide-react';

const mockCategories = [
  { id: '1', name: 'Burgers', emoji: '🍔', count: 12 },
  { id: '2', name: 'Pizzas', emoji: '🍕', count: 8 },
  { id: '3', name: 'Açaí', emoji: '🍇', count: 6 },
  { id: '4', name: 'Bebidas', emoji: '🥤', count: 15 },
  { id: '5', name: 'Sobremesas', emoji: '🍰', count: 9 },
];

const mockProducts = [
  { id: '1', name: 'X-Burger Especial', description: 'Pão, hambúrguer 180g, queijo, bacon, alface e tomate', price: 28.90, image: '🍔' },
  { id: '2', name: 'X-Bacon Duplo', description: 'Pão, 2 hambúrgueres, muito bacon, queijo cheddar', price: 35.90, image: '🍔' },
  { id: '3', name: 'Pizza Margherita', description: 'Molho de tomate, muçarela, tomate e manjericão', price: 45.90, image: '🍕' },
  { id: '4', name: 'Açaí 500ml', description: 'Açaí batido com banana e granola', price: 22.00, image: '🍇' },
];

export default function ClientPanel() {
  const { config } = useConfig();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                2
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="relative px-4 md:px-6 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Store Info */}
            <Card className="p-6 glass mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{config.establishment.name}</h1>
                    {config.establishment.isOpen ? (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">Aberto</span>
                    ) : (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Fechado</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="text-foreground font-medium">4.8</span>
                      <span>(245)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{config.establishment.estimatedDeliveryTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      <span>R$ {config.establishment.deliveryFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{config.establishment.address}</span>
              </div>
            </Card>

            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Categorias</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {mockCategories.map((category) => (
                  <button
                    key={category.id}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <span className="text-lg">{category.emoji}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Destaques</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {mockProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="p-4 glass glass-hover cursor-pointer"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {product.description}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center text-4xl">
                        {product.image}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Cart Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t p-4 md:hidden">
        <Button className="w-full gap-2">
          <ShoppingBag className="h-5 w-5" />
          Ver Carrinho
          <span className="ml-auto">R$ 64.80</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
