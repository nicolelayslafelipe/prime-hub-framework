import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface OnlinePaymentConfig {
  isActive: boolean;
}

const defaultConfig: OnlinePaymentConfig = {
  isActive: false
};

export default function AdminOnlinePayment() {
  const { value: savedConfig, updateValue, isLoading, isSaving } = useAdminSettings<OnlinePaymentConfig>('online_payment', defaultConfig);
  const [config, setConfig] = useState<OnlinePaymentConfig>(defaultConfig);

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const handleToggle = async (isActive: boolean) => {
    const newConfig = { ...config, isActive };
    setConfig(newConfig);
    await updateValue(newConfig);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Pagamento Online" subtitle="Ative ou desative o pagamento online">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pagamento Online" subtitle="Ative ou desative o pagamento online">
      <div className="max-w-2xl">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Pagamento Online</h3>
              <p className="text-sm text-muted-foreground">Aceite pagamentos diretamente no app</p>
            </div>
          </div>
          <StatusToggle 
            checked={config.isActive} 
            onCheckedChange={handleToggle} 
            label="Ativar Pagamento Online" 
            description="Clientes poderão pagar PIX ou cartão antes da entrega" 
            activeLabel="Ativo" 
            inactiveLabel="Desativado"
            disabled={isSaving}
          />
        </div>
        {config.isActive && (
          <div className="card-premium p-6 mt-4">
            <p className="text-sm text-muted-foreground">Configure as integrações de pagamento em:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Mercado Pago</li>
              <li>• Formas de Pagamento</li>
              <li>• Mensagens PIX</li>
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
