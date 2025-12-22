import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Wallet, CheckCircle, XCircle, RefreshCw, Loader2, Shield, Key, AlertTriangle } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MercadoPagoConfig {
  isActive: boolean;
  environment: 'test' | 'production';
  status: 'disconnected' | 'connected' | 'error';
  credentialsVersion: number;
  lastUpdated?: string;
}

const defaultConfig: MercadoPagoConfig = {
  isActive: false,
  environment: 'test',
  status: 'disconnected',
  credentialsVersion: 1
};

export default function AdminMercadoPago() {
  const { value: savedConfig, updateValue, isLoading, isSaving } = useAdminSettings<MercadoPagoConfig>('mercado_pago', defaultConfig);
  const [config, setConfig] = useState<MercadoPagoConfig>(defaultConfig);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const updateField = <K extends keyof MercadoPagoConfig>(field: K, value: MercadoPagoConfig[K]) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    updateValue(newConfig);
  };

  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    if (!newToken.startsWith('APP_USR-') && !newToken.startsWith('TEST-')) {
      toast.error('Token inválido. Deve começar com APP_USR- ou TEST-');
      return;
    }

    setIsUpdatingToken(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-payment-credentials', {
        body: { 
          provider: 'mercadopago',
          accessToken: newToken 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Credenciais atualizadas com sucesso!');
      setIsTokenDialogOpen(false);
      setNewToken('');
      
      // Update status to connected with incremented version
      const newConfig: MercadoPagoConfig = {
        ...config,
        status: 'connected',
        credentialsVersion: (config.credentialsVersion || 1) + 1,
        lastUpdated: new Date().toISOString()
      };
      setConfig(newConfig);
      updateValue(newConfig);
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error('Erro ao atualizar credenciais');
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-payment-connection', {
        body: { provider: 'mercadopago' }
      });

      if (error) throw error;
      
      if (data?.connected) {
        updateField('status', 'connected');
        toast.success('Conexão verificada com sucesso!');
      } else {
        updateField('status', 'error');
        toast.error(data?.message || 'Falha na conexão');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      updateField('status', 'error');
      toast.error('Erro ao testar conexão. Verifique se o token está configurado.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Mercado Pago" subtitle="Configure a integração com Mercado Pago">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mercado Pago" subtitle="Configure a integração com Mercado Pago">
      <div className="max-w-2xl space-y-6">
        {/* Header Card */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-[#009ee3]/10">
              <Wallet className="h-6 w-6 text-[#009ee3]" />
            </div>
            <div>
              <h3 className="font-semibold">Mercado Pago</h3>
              <p className="text-sm text-muted-foreground">Receba pagamentos via PIX, cartão e boleto</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {config.status === 'connected' && (
                <>
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-sm text-accent">Conectado</span>
                </>
              )}
              {config.status === 'error' && (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-destructive">Erro</span>
                </>
              )}
              {config.status === 'disconnected' && (
                <span className="text-sm text-muted-foreground">Desconectado</span>
              )}
            </div>
          </div>

          <StatusToggle 
            checked={config.isActive} 
            onCheckedChange={v => updateField('isActive', v)} 
            label="Ativar Mercado Pago" 
            description="Habilite para aceitar pagamentos via Mercado Pago"
            disabled={isSaving}
          />
        </div>

        {config.isActive && (
          <>
            {/* Environment Selection */}
            <div className="card-premium p-6 space-y-4">
              <h4 className="font-medium">Ambiente</h4>
              <div className="flex gap-4">
                <Button 
                  variant={config.environment === 'test' ? 'default' : 'outline'} 
                  onClick={() => updateField('environment', 'test')} 
                  className="flex-1"
                  disabled={isSaving}
                >
                  🧪 Teste (Sandbox)
                </Button>
                <Button 
                  variant={config.environment === 'production' ? 'default' : 'outline'} 
                  onClick={() => updateField('environment', 'production')} 
                  className="flex-1"
                  disabled={isSaving}
                >
                  🚀 Produção
                </Button>
              </div>
              {config.environment === 'test' && (
                <p className="text-sm text-yellow-500">⚠️ Modo teste: pagamentos não serão processados de verdade</p>
              )}
            </div>

            {/* Security Info Card */}
            <div className="card-premium p-6 border-l-4 border-l-primary">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium">Credenciais Seguras</h4>
                  <p className="text-sm text-muted-foreground">
                    Seu Access Token está armazenado de forma segura nos secrets do servidor. 
                    Ele <strong>nunca é enviado ao navegador</strong> e é usado apenas no backend 
                    para processar pagamentos.
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials Management */}
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Gerenciar Credenciais</h4>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Access Token</p>
                    <p className="text-xs text-muted-foreground">
                      {config.status === 'connected' 
                        ? '••••••••••••••••••••' 
                        : 'Não configurado'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsTokenDialogOpen(true)}
                    disabled={isSaving}
                  >
                    {config.status === 'connected' ? 'Atualizar' : 'Configurar'}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={testConnection} 
                variant="outline" 
                className="w-full gap-2"
                disabled={isSaving || isTestingConnection}
              >
                {isTestingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Testar Conexão
              </Button>
            </div>

            {/* Warning for test mode */}
            {config.environment === 'test' && config.status === 'connected' && (
              <div className="card-premium p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Ambiente de Teste</h4>
                    <p className="text-sm text-muted-foreground">
                      Você está usando credenciais de teste. Lembre-se de atualizar para 
                      credenciais de produção antes de ir ao ar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Token Update Dialog */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Atualizar Access Token
            </DialogTitle>
            <DialogDescription>
              Insira seu Access Token do Mercado Pago. Esta credencial será armazenada 
              de forma segura nos secrets do servidor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input 
                id="token"
                type="password"
                placeholder="APP_USR-..."
                value={newToken}
                onChange={e => setNewToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Encontre suas credenciais em{' '}
                <a 
                  href="https://www.mercadopago.com.br/developers/panel/app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Mercado Pago Developers
                </a>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTokenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateToken} 
              disabled={isUpdatingToken || !newToken.trim()}
            >
              {isUpdatingToken ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Token'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
