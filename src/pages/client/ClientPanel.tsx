import { Logo } from '@/components/shared/Logo';
import { useConfig } from '@/contexts/ConfigContext';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Clock, 
  MapPin, 
  ShoppingBag,
  ChevronRight,
  Star,
  Truck,
  Plus,
} from 'lucide-react';

const mockCategories = [
  { id: '1', name: 'Burgers', count: 12 },
  { id: '2', name: 'Pizzas', count: 8 },
  { id: '3', name: 'Açaí', count: 6 },
  { id: '4', name: 'Bebidas', count: 15 },
  { id: '5', name: 'Sobremesas', count: 9 },
];

const mockProducts = [
  { id: '1', name: 'X-Burger Especial', description: 'Pão brioche, hambúrguer angus 180g, queijo cheddar, bacon crocante, alface americana e molho especial', price: 28.90, originalPrice: 34.90, image: '🍔', tag: 'MAIS VENDIDO' },
  { id: '2', name: 'X-Bacon Duplo', description: 'Pão australiano, 2 hambúrgueres 150g, camadas de bacon, queijo cheddar derretido e onion rings', price: 35.90, image: '🍔', tag: 'NOVO' },
  { id: '3', name: 'Pizza Margherita', description: 'Molho pomodoro artesanal, muçarela de búfala, tomate cereja e manjericão fresco', price: 45.90, image: '🍕' },
  { id: '4', name: 'Açaí Premium 500ml', description: 'Açaí puro batido com banana, granola artesanal, mel orgânico e frutas da estação', price: 22.00, image: '🍇', tag: 'POPULAR' },
];

export default function ClientPanel() {
  const { config } = useConfig();

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 gradient-radial-subtle" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <Logo size="sm" />
            <Button className="bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Carrinho
              <span className="ml-2 bg-primary-foreground/20 px-2 py-0.5 rounded text-xs font-semibold">
                2
              </span>
            </Button>
          </div>
        </header>

        {/* Hero Store Banner */}
        <section className="py-8 px-4 md:px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-20 w-20 rounded-xl bg-primary flex items-center justify-center">
                <Store className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{config.establishment.name}</h1>
                  {config.establishment.isOpen ? (
                    <span className="px-2.5 py-1 rounded-md bg-accent/15 text-accent text-xs font-medium">
                      Aberto
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-medium">
                      Fechado
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />
                      ))}
                    </div>
                    <span className="font-medium text-foreground">4.9</span>
                    <span>(1.2k)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{config.establishment.estimatedDeliveryTime} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    <span className="text-accent font-medium">Frete Grátis</span>
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
        <section className="px-4 md:px-6 py-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {mockCategories.map((category, index) => (
                <button
                  key={category.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    index === 0 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {category.name}
                  <span className="ml-2 opacity-70">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="px-4 md:px-6 py-8 pb-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-6">Destaques</h2>
            <div className="space-y-4">
              {mockProducts.map((product) => (
                <div
                  key={product.id}
                  className="card-premium-hover p-5 flex gap-4 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {product.name}
                      </h3>
                      {product.tag && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-primary/15 text-primary">
                          {product.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-foreground">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-24 w-24 rounded-lg bg-muted flex items-center justify-center text-5xl flex-shrink-0">
                    {product.image}
                    <button className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-premium-sm hover:bg-primary/90 transition-colors">
                      <Plus className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Cart Bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <Button className="w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver Carrinho
              <span className="ml-auto font-bold">R$ 64.80</span>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
