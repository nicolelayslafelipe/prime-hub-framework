import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ChefHat,
  Bike,
  ShoppingBag,
  ArrowRight,
  Zap,
  Settings2,
  Star,
} from 'lucide-react';

const panels = [
  {
    id: 'admin',
    title: 'Painel Admin',
    description: 'Controle total do seu negócio',
    icon: Shield,
    path: '/admin',
  },
  {
    id: 'kitchen',
    title: 'Painel Cozinha',
    description: 'Gestão de pedidos em tempo real',
    icon: ChefHat,
    path: '/kitchen',
  },
  {
    id: 'motoboy',
    title: 'Painel Motoboy',
    description: 'Entregas otimizadas',
    icon: Bike,
    path: '/motoboy',
  },
  {
    id: 'client',
    title: 'Cardápio',
    description: 'Experiência premium de pedidos',
    icon: ShoppingBag,
    path: '/client',
  },
];

const features = [
  { 
    icon: Zap, 
    title: 'Tempo Real', 
    description: 'Atualizações instantâneas',
  },
  { 
    icon: Settings2, 
    title: '100% Configurável', 
    description: 'Personalize cada detalhe',
  },
  { 
    icon: Star, 
    title: 'White-Label', 
    description: 'Sua marca, sua identidade',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle radial gradient */}
      <div className="fixed inset-0 gradient-radial-subtle" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-8">
              {['Admin', 'Cozinha', 'Motoboy', 'Cardápio'].map((item, i) => (
                <Link 
                  key={item}
                  to={['admin', 'kitchen', 'motoboy', 'client'][i]} 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
            <Button asChild className="bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              <Link to="/admin">
                Acessar Sistema
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8">
                <span className="text-sm font-medium text-primary">Sistema White-Label SaaS</span>
              </div>
              
              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                O Sistema de Delivery
                <br />
                <span className="text-gradient-gold">Mais Avançado</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Plataforma completa e premium para transformar seu negócio de delivery.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="bg-primary text-primary-foreground font-semibold h-12 px-6 hover:bg-primary/90">
                  <Link to="/admin">
                    Acessar Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-medium h-12 px-6">
                  <Link to="/client">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Ver Cardápio
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-16 pt-12 border-t border-border">
                {[
                  { value: '99.9%', label: 'Uptime' },
                  { value: '< 50ms', label: 'Latência' },
                  { value: '∞', label: 'Escalável' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gradient-gold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Strip */}
        <section className="border-y border-border bg-card py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Panels Grid */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
                Painéis do Sistema
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Cada função do seu negócio tem um painel dedicado e otimizado.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {panels.map((panel) => (
                <Link key={panel.id} to={panel.path}>
                  <div className="card-premium-hover p-6 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <panel.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">
                        {panel.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {panel.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Pronto para revolucionar
                <br />seu delivery?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Junte-se aos estabelecimentos que já transformaram sua operação.
              </p>
              <Button size="lg" asChild className="bg-primary text-primary-foreground font-semibold h-12 px-8 hover:bg-primary/90">
                <Link to="/admin">
                  Começar Agora
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                © 2024 DeliveryOS. Sistema White-Label Premium.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
