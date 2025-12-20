import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, Moon, Smartphone } from 'lucide-react';

export default function ClientSettings() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Configurações</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="flex flex-col gap-1">
                <span>Notificações Push</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receber atualizações sobre seus pedidos
                </span>
              </Label>
              <Switch id="push-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="promo-notifications" className="flex flex-col gap-1">
                <span>Promoções</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receber ofertas e novidades
                </span>
              </Label>
              <Switch id="promo-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="save-payment" className="flex flex-col gap-1">
                <span>Salvar forma de pagamento</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Lembrar última forma de pagamento
                </span>
              </Label>
              <Switch id="save-payment" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
