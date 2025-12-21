import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface MercadoPagoConfig {
  isActive: boolean;
  environment: 'test' | 'production';
  publicKey: string;
  accessToken: string;
  status: 'disconnected' | 'connected' | 'error';
}

const defaultConfig: MercadoPagoConfig = {
  isActive: false,
  environment: 'test',
  publicKey: '',
  accessToken: '',
  status: 'disconnected'
};

export default function AdminMercadoPago() {
  const { value: savedConfig, updateValue, isLoading, isSaving } = useAdminSettings<MercadoPagoConfig>('mercado_pago', defaultConfig);
  const [config, setConfig] = useState<MercadoPagoConfig>(defaultConfig);

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

  const testConnection = () => {
    if (config.publicKey && config.accessToken) {
      updateField('status', 'connected');
    } else {
      updateField('status', 'error');
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

            <div className="card-premium p-6 space-y-4">
              <h4 className="font-medium">Credenciais</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Public Key</label>
                  <Input 
                    placeholder="APP_USR-..." 
                    value={config.publicKey} 
                    onChange={e => updateField('publicKey', e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Access Token</label>
                  <Input 
                    type="password" 
                    placeholder="APP_USR-..." 
                    value={config.accessToken} 
                    onChange={e => updateField('accessToken', e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <Button 
                onClick={testConnection} 
                variant="outline" 
                className="w-full gap-2"
                disabled={isSaving}
              >
                <RefreshCw className="h-4 w-4" />Testar Conexão
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
