import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, Smartphone, Loader2 } from 'lucide-react';
import { useClientPreferences } from '@/hooks/useClientPreferences';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientSettings() {
  const { user } = useAuth();
  const { preferences, isLoading, isSaving, updatePreference } = useClientPreferences();

  if (!user) {
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
        <main className="p-4 max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Faça login para acessar suas configurações</p>
              <Button asChild className="mt-4">
                <Link to="/auth">Entrar</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
          )}
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
            {isLoading ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-11" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications" className="flex flex-col gap-1 cursor-pointer">
                    <span>Notificações Push</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Receber atualizações sobre seus pedidos
                    </span>
                  </Label>
                  <Switch 
                    id="push-notifications" 
                    checked={preferences?.push_notifications ?? true}
                    onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="promo-notifications" className="flex flex-col gap-1 cursor-pointer">
                    <span>Promoções</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Receber ofertas e novidades
                    </span>
                  </Label>
                  <Switch 
                    id="promo-notifications" 
                    checked={preferences?.promo_notifications ?? false}
                    onCheckedChange={(checked) => updatePreference('promo_notifications', checked)}
                    disabled={isSaving}
                  />
                </div>
              </>
            )}
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
            {isLoading ? (
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-6 w-11" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Label htmlFor="save-payment" className="flex flex-col gap-1 cursor-pointer">
                  <span>Salvar forma de pagamento</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Lembrar última forma de pagamento
                  </span>
                </Label>
                <Switch 
                  id="save-payment" 
                  checked={preferences?.save_payment_method ?? true}
                  onCheckedChange={(checked) => updatePreference('save_payment_method', checked)}
                  disabled={isSaving}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
