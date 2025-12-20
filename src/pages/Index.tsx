import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Shield,
  ChefHat,
  Bike,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Zap,
  Settings2,
} from 'lucide-react';

const panels = [
  {
    id: 'admin',
    title: 'Painel Admin',
    description: 'Gerencie pedidos, usuários e configurações do sistema',
    icon: Shield,
    path: '/admin',
    color: 'from-primary/20 to-primary/5 border-primary/20',
    iconColor: 'text-primary',
  },
  {
    id: 'kitchen',
    title: 'Painel Cozinha',
    description: 'Visualize e gerencie pedidos em preparação',
    icon: ChefHat,
    path: '/kitchen',
    color: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
    iconColor: 'text-orange-500',
  },
  {
    id: 'motoboy',
    title: 'Painel Motoboy',
    description: 'Aceite e gerencie entregas em tempo real',
    icon: Bike,
    path: '/motoboy',
    color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    id: 'client',
    title: 'Painel Cliente',
    description: 'Faça pedidos e acompanhe o status',
    icon: ShoppingBag,
    path: '/client',
    color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    iconColor: 'text-purple-500',
  },
];

const features = [
  { icon: Zap, title: 'Tempo Real', description: 'Atualizações instantâneas em todos os painéis' },
  { icon: Settings2, title: '100% Configurável', description: 'Personalize cada aspecto do sistema' },
  { icon: Sparkles, title: 'White-Label', description: 'Sua marca, sua identidade visual' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
            <Link to="/kitchen" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cozinha
            </Link>
            <Link to="/motoboy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Motoboy
            </Link>
            <Link to="/client" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cliente
            </Link>
          </nav>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              Acessar Sistema
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Sistema White-Label SaaS
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              O Sistema de Delivery
              <span className="text-gradient"> Mais Avançado</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plataforma completa e configurável para gerenciar seu delivery. 
              Painéis dedicados para cada função do seu negócio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link to="/admin">
                  Acessar Painel Admin
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/client">
                  Ver Cardápio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
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

      {/* Panels */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Painéis do Sistema</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada função do seu negócio tem um painel dedicado e otimizado para suas necessidades.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {panels.map((panel) => (
              <Link key={panel.id} to={panel.path}>
                <Card className={`p-6 glass glass-hover h-full bg-gradient-to-br ${panel.color} border transition-all duration-300 hover:scale-[1.02]`}>
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-background/50 flex items-center justify-center ${panel.iconColor}`}>
                      <panel.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{panel.title}</h3>
                      <p className="text-sm text-muted-foreground">{panel.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              Sistema de Delivery White-Label © 2024. Desenvolvido com ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
