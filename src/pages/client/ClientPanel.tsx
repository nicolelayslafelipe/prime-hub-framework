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
  Flame,
  Sparkles
} from 'lucide-react';

const mockCategories = [
  { id: '1', name: 'Burgers', emoji: '🍔', count: 12, color: 'from-orange-500 to-red-500' },
  { id: '2', name: 'Pizzas', emoji: '🍕', count: 8, color: 'from-red-500 to-pink-500' },
  { id: '3', name: 'Açaí', emoji: '🍇', count: 6, color: 'from-purple-500 to-violet-500' },
  { id: '4', name: 'Bebidas', emoji: '🥤', count: 15, color: 'from-cyan-500 to-blue-500' },
  { id: '5', name: 'Sobremesas', emoji: '🍰', count: 9, color: 'from-pink-500 to-rose-500' },
];

const mockProducts = [
  { id: '1', name: 'X-Burger Especial', description: 'Pão brioche, hambúrguer angus 180g, queijo cheddar, bacon crocante, alface americana e molho especial', price: 28.90, originalPrice: 34.90, image: '🍔', tag: 'MAIS VENDIDO', tagColor: 'from-primary to-accent' },
  { id: '2', name: 'X-Bacon Duplo', description: 'Pão australiano, 2 hambúrgueres 150g, camadas de bacon, queijo cheddar derretido e onion rings', price: 35.90, image: '🍔', tag: 'NOVO', tagColor: 'from-neon-blue to-neon-cyan' },
  { id: '3', name: 'Pizza Margherita', description: 'Molho pomodoro artesanal, muçarela de búfala, tomate cereja e manjericão fresco', price: 45.90, image: '🍕' },
  { id: '4', name: 'Açaí Premium 500ml', description: 'Açaí puro batido com banana, granola artesanal, mel orgânico e frutas da estação', price: 22.00, image: '🍇', tag: 'POPULAR', tagColor: 'from-purple-500 to-pink-500' },
];

export default function ClientPanel() {
  const { config } = useConfig();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 gradient-mesh opacity-30" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-2xl sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 md:px-6 h-20">
            <Logo size="sm" />
            <Button className="relative gradient-primary text-primary-foreground font-semibold rounded-full shadow-glow">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Carrinho
              <span className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center border-2 border-background">
                2
              </span>
            </Button>
          </div>
        </header>

        {/* Hero Store Banner */}
        <section className="relative py-12 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-xl p-8 md:p-10">
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-neon-pink" />
              
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                  <Store className="h-12 w-12 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-black">{config.establishment.name}</h1>
                    {config.establishment.isOpen ? (
                      <span className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-semibold border border-success/30 shadow-[0_0_20px_-5px_hsl(var(--success)/0.5)]">
                        Aberto
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-semibold border border-destructive/30">
                        Fechado
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-warning fill-warning" />
                        ))}
                      </div>
                      <span className="font-bold">4.9</span>
                      <span className="text-muted-foreground">(1.2k)</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-neon-cyan" />
                      <span>{config.establishment.estimatedDeliveryTime} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="h-4 w-4 text-neon-green" />
                      <span className="text-success font-semibold">Grátis</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border/30 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                <span>{config.establishment.address}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-4 md:px-6 mb-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Categorias
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {mockCategories.map((category) => (
                <button
                  key={category.id}
                  className="group flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{category.emoji}</span>
                  <span className="font-semibold">{category.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="px-4 md:px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Flame className="h-5 w-5 text-neon-orange" />
              Destaques
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative rounded-3xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.3)] cursor-pointer"
                >
                  {/* Tag */}
                  {product.tag && (
                    <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r ${product.tagColor} text-white text-xs font-bold shadow-lg`}>
                      {product.tag}
                    </div>
                  )}

                  <div className="p-6 flex gap-5">
                    <div className="flex-1 space-y-3">
                      <h3 className="text-xl font-bold group-hover:gradient-text transition-all">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-2xl font-black gradient-text">
                          R$ {product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-28 w-28 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                      {product.image}
                      <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                        <Plus className="h-5 w-5 text-primary-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Cart Bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/90 backdrop-blur-2xl p-4 z-50">
          <div className="max-w-5xl mx-auto">
            <Button className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-lg shadow-glow hover:shadow-glow-lg transition-all">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ver Carrinho
              <span className="ml-auto font-black">R$ 64.80</span>
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
