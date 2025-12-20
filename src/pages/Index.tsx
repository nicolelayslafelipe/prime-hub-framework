import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ChefHat,
  Bike,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Zap,
  Settings2,
  Star,
  Play,
} from 'lucide-react';

const panels = [
  {
    id: 'admin',
    title: 'Painel Admin',
    description: 'Controle total do seu negócio',
    icon: Shield,
    path: '/admin',
    gradient: 'from-primary via-primary to-accent',
    glow: 'group-hover:shadow-[0_0_60px_-15px_hsl(var(--primary)/0.6)]',
  },
  {
    id: 'kitchen',
    title: 'Painel Cozinha',
    description: 'Gestão de pedidos em tempo real',
    icon: ChefHat,
    path: '/kitchen',
    gradient: 'from-neon-orange via-neon-orange to-warning',
    glow: 'group-hover:shadow-[0_0_60px_-15px_hsl(var(--neon-orange)/0.6)]',
  },
  {
    id: 'motoboy',
    title: 'Painel Motoboy',
    description: 'Entregas otimizadas',
    icon: Bike,
    path: '/motoboy',
    gradient: 'from-neon-blue via-neon-blue to-neon-cyan',
    glow: 'group-hover:shadow-[0_0_60px_-15px_hsl(var(--neon-blue)/0.6)]',
  },
  {
    id: 'client',
    title: 'Cardápio',
    description: 'Experiência premium de pedidos',
    icon: ShoppingBag,
    path: '/client',
    gradient: 'from-accent via-accent to-neon-pink',
    glow: 'group-hover:shadow-[0_0_60px_-15px_hsl(var(--accent)/0.6)]',
  },
];

const features = [
  { 
    icon: Zap, 
    title: 'Tempo Real', 
    description: 'Atualizações instantâneas',
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10'
  },
  { 
    icon: Settings2, 
    title: '100% Configurável', 
    description: 'Personalize cada detalhe',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  { 
    icon: Sparkles, 
    title: 'White-Label', 
    description: 'Sua marca, sua identidade',
    color: 'text-accent',
    bg: 'bg-accent/10'
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 gradient-mesh opacity-50" />
      <div className="fixed inset-0 noise" />
      
      {/* Animated orbs */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-float" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
      <div className="fixed top-1/2 right-1/3 w-[400px] h-[400px] bg-neon-blue/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-1.5s' }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/50 backdrop-blur-2xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-8">
              {['Admin', 'Cozinha', 'Motoboy', 'Cardápio'].map((item, i) => (
                <Link 
                  key={item}
                  to={['admin', 'kitchen', 'motoboy', 'client'][i]} 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>
            <Button 
              asChild 
              className="gradient-primary text-primary-foreground font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300"
            >
              <Link to="/admin">
                Acessar Sistema
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative py-24 md:py-40">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8 animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Sistema White-Label SaaS</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              
              {/* Title */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tighter animate-slide-up">
                O Sistema de
                <br />
                <span className="gradient-text">Delivery</span>
                <br />
                <span className="text-muted-foreground">Mais Avançado</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Plataforma completa e premium para 
                <span className="text-foreground font-medium"> transformar</span> seu negócio de delivery.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Button 
                  size="lg" 
                  asChild 
                  className="gradient-primary text-primary-foreground font-bold text-lg h-14 px-8 rounded-2xl shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
                >
                  <Link to="/admin">
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Acessar Dashboard
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild 
                  className="font-bold text-lg h-14 px-8 rounded-2xl border-border/50 bg-card/50 backdrop-blur-xl hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
                >
                  <Link to="/client">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Ver Cardápio
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-16 border-t border-border/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {[
                  { value: '99.9%', label: 'Uptime' },
                  { value: '< 50ms', label: 'Latência' },
                  { value: '∞', label: 'Escalável' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl md:text-4xl font-black gradient-text">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Strip */}
        <section className="border-y border-border/30 bg-card/30 backdrop-blur-xl py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div 
                  key={feature.title} 
                  className="flex items-center gap-4 animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`h-14 w-14 rounded-2xl ${feature.bg} flex items-center justify-center`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Panels Grid */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                Painéis do <span className="gradient-text">Sistema</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Cada função do seu negócio tem um painel dedicado e otimizado.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {panels.map((panel, i) => (
                <Link 
                  key={panel.id} 
                  to={panel.path}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div 
                    className={`group relative p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/30 ${panel.glow}`}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${panel.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    {/* Content */}
                    <div className="relative flex items-start gap-6">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${panel.gradient} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        <panel.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2 group-hover:gradient-text transition-all duration-300">
                          {panel.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {panel.description}
                        </p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                    </div>

                    {/* Bottom accent line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${panel.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 border-t border-border/30">
          <div className="container mx-auto px-4">
            <div className="relative max-w-4xl mx-auto text-center">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl opacity-30" />
              
              <div className="relative">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-warning fill-warning" />
                  ))}
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                  Pronto para <span className="gradient-text">revolucionar</span>
                  <br />seu delivery?
                </h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                  Junte-se aos estabelecimentos que já transformaram sua operação.
                </p>
                <Button 
                  size="lg" 
                  asChild 
                  className="gradient-primary text-primary-foreground font-bold text-lg h-14 px-10 rounded-2xl shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
                >
                  <Link to="/admin">
                    Começar Agora
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-12 bg-card/30 backdrop-blur-xl">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                © 2024 DeliveryOS. Sistema White-Label Premium.
              </p>
              <div className="flex items-center gap-6">
                <span className="text-sm text-muted-foreground">Feito com</span>
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
