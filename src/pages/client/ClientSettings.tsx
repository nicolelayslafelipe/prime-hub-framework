import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, Smartphone, Loader2, Check, AlertCircle, BellOff } from 'lucide-react';
import { useClientPreferences } from '@/hooks/useClientPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface PreferenceItemProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  isProcessing?: boolean;
  showSuccess?: boolean;
  unavailable?: boolean;
  unavailableReason?: string;
  onCheckedChange: (checked: boolean) => void;
}

function PreferenceItem({ 
  id, 
  label, 
  description, 
  checked, 
  disabled, 
  isProcessing, 
  showSuccess,
  unavailable,
  unavailableReason,
  onCheckedChange 
}: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="flex flex-col gap-1 cursor-pointer flex-1">
        <span className="flex items-center gap-2">
          {label}
          {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          {showSuccess && !isProcessing && <Check className="h-3 w-3 text-green-500" />}
        </span>
        <span className="font-normal text-sm text-muted-foreground">
          {unavailable ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              {unavailableReason}
            </span>
          ) : (
            description
          )}
        </span>
      </Label>
      <Switch 
        id={id} 
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || unavailable}
      />
    </div>
  );
}

export default function ClientSettings() {
  const { user } = useAuth();
  const { preferences, isLoading, isSaving, updatePreference } = useClientPreferences();
  const { 
    isSubscribed, 
    isLoading: isPushLoading, 
    isProcessing: isPushProcessing,
    isSupported: isPushSupported,
    permissionState,
    toggleSubscription 
  } = usePushNotifications();

  // Track which preferences were recently saved for success animation
  const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set());
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    if (!preferences) return;

    setSavingFields(prev => new Set(prev).add(key));
    await updatePreference(key, value);
    setSavingFields(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    // Show success state briefly
    setRecentlySaved(prev => new Set(prev).add(key));
    setTimeout(() => {
      setRecentlySaved(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  };

  const handlePushToggle = async (checked: boolean) => {
    setSavingFields(prev => new Set(prev).add('push'));
    
    // Also update the preference in database
    if (preferences) {
      await updatePreference('push_notifications', checked);
    }
    
    // Toggle actual push subscription
    await toggleSubscription();
    
    setSavingFields(prev => {
      const next = new Set(prev);
      next.delete('push');
      return next;
    });

    setRecentlySaved(prev => new Set(prev).add('push'));
    setTimeout(() => {
      setRecentlySaved(prev => {
        const next = new Set(prev);
        next.delete('push');
        return next;
      });
    }, 2000);
  };

  // Determine push notification state
  const getPushState = () => {
    if (!isPushSupported) {
      return {
        unavailable: true,
        unavailableReason: 'Seu navegador não suporta notificações push',
      };
    }
    if (permissionState === 'denied') {
      return {
        unavailable: true,
        unavailableReason: 'Notificações bloqueadas nas configurações do navegador',
      };
    }
    return { unavailable: false };
  };

  const pushState = getPushState();

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
          {(isSaving || savingFields.size > 0) && (
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
            {isLoading || isPushLoading ? (
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
                <PreferenceItem
                  id="push-notifications"
                  label="Notificações Push"
                  description="Receber atualizações sobre seus pedidos"
                  checked={isSubscribed && (preferences?.push_notifications ?? true)}
                  disabled={isPushProcessing || savingFields.has('push')}
                  isProcessing={isPushProcessing || savingFields.has('push')}
                  showSuccess={recentlySaved.has('push')}
                  unavailable={pushState.unavailable}
                  unavailableReason={pushState.unavailableReason}
                  onCheckedChange={handlePushToggle}
                />
                <PreferenceItem
                  id="promo-notifications"
                  label="Promoções"
                  description="Receber ofertas e novidades"
                  checked={preferences?.promo_notifications ?? false}
                  disabled={savingFields.has('promo_notifications')}
                  isProcessing={savingFields.has('promo_notifications')}
                  showSuccess={recentlySaved.has('promo_notifications')}
                  onCheckedChange={(checked) => handlePreferenceChange('promo_notifications', checked)}
                />
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
              <PreferenceItem
                id="save-payment"
                label="Salvar forma de pagamento"
                description="Lembrar última forma de pagamento"
                checked={preferences?.save_payment_method ?? true}
                disabled={savingFields.has('save_payment_method')}
                isProcessing={savingFields.has('save_payment_method')}
                showSuccess={recentlySaved.has('save_payment_method')}
                onCheckedChange={(checked) => handlePreferenceChange('save_payment_method', checked)}
              />
            )}
          </CardContent>
        </Card>

        {/* Info card about notifications */}
        {!isPushSupported && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <BellOff className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Notificações Push não disponíveis
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Seu navegador não suporta notificações push. Use o Chrome, Firefox ou Safari para receber notificações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
