import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share, Plus, Check, Smartphone, ArrowLeft } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const { config } = useConfig();

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream);
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  // Already installed
  if (isStandalone || installed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">App Instalado!</h1>
            <p className="text-muted-foreground mb-6">
              O {config.establishment.name} já está instalado no seu dispositivo.
            </p>
            <Link to="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao App
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-4">
          {config.establishment.logo ? (
            <img 
              src={config.establishment.logo} 
              alt={config.establishment.name}
              className="w-16 h-16 rounded-2xl object-cover bg-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Smartphone className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{config.establishment.name}</h1>
            <p className="text-sm opacity-80">Instale nosso aplicativo</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Por que instalar?</h2>
            
            <ul className="space-y-3 mb-6">
              {[
                'Acesso rápido direto da tela inicial',
                'Funciona mesmo offline',
                'Notificações de pedidos em tempo real',
                'Experiência mais rápida e fluida',
                'Sem ocupar espaço como apps tradicionais'
              ].map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* iOS Instructions */}
            {isIOS && (
              <div className="space-y-4">
                <h3 className="font-medium">Como instalar no iPhone/iPad:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Toque no botão Compartilhar</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Share className="w-3 h-3" /> Na barra inferior do Safari
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Adicionar à Tela de Início</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Role para baixo e toque nesta opção
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Confirme tocando em "Adicionar"</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O ícone aparecerá na sua tela inicial
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Android/Chrome Install Button */}
            {(isAndroid || deferredPrompt) && !isIOS && (
              <Button 
                onClick={handleInstall} 
                size="lg" 
                className="w-full"
                disabled={!deferredPrompt}
              >
                <Download className="w-5 h-5 mr-2" />
                {deferredPrompt ? 'Instalar Aplicativo' : 'Carregando...'}
              </Button>
            )}

            {/* Desktop Instructions */}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Acesse este site pelo seu celular para instalar o aplicativo, 
                  ou procure pelo ícone de instalação na barra de endereço do navegador.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
