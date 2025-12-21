import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface FirstOrderConfig {
  isActive: boolean;
  message: string;
  requirePhone: boolean;
  requireDocument: boolean;
}

const defaultConfig: FirstOrderConfig = {
  isActive: false,
  message: 'Por ser seu primeiro pedido, precisamos confirmar alguns dados por segurança. Por favor, aguarde nosso contato.',
  requirePhone: true,
  requireDocument: false
};

export default function AdminFirstOrderVerification() {
  const { value: savedConfig, updateValue, isLoading, isSaving } = useAdminSettings<FirstOrderConfig>('first_order_verification', defaultConfig);
  const [config, setConfig] = useState<FirstOrderConfig>(defaultConfig);

  useEffect(() => {
    if (savedConfig) {
      setConfig({
        ...defaultConfig,
        ...savedConfig,
        message: savedConfig.message || defaultConfig.message
      });
    }
  }, [savedConfig]);

  const updateField = <K extends keyof FirstOrderConfig>(field: K, value: FirstOrderConfig[K]) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    updateValue(newConfig);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Verificação Primeiro Pedido" subtitle="Configure a verificação antifraude">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Verificação Primeiro Pedido" subtitle="Configure a verificação antifraude">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Verificação de Primeiro Pedido</h3>
              <p className="text-sm text-muted-foreground">Proteção contra fraudes</p>
            </div>
          </div>
          <StatusToggle 
            checked={config.isActive} 
            onCheckedChange={v => updateField('isActive', v)} 
            label="Ativar Verificação" 
            description="Verificar novos clientes antes do primeiro pedido"
            disabled={isSaving}
          />
        </div>

        {config.isActive && (
          <div className="card-premium p-6">
            <h4 className="font-medium mb-3">Mensagem de Verificação</h4>
            <Textarea 
              value={config.message} 
              onChange={e => updateField('message', e.target.value)} 
              rows={4} 
              placeholder="Mensagem exibida ao cliente..."
              disabled={isSaving}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Exibida quando um novo cliente faz o primeiro pedido
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
