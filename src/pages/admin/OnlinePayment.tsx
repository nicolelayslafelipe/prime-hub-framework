import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { CreditCard } from 'lucide-react';

export default function AdminOnlinePayment() {
  const [isActive, setIsActive] = useState(false);

  return (
    <AdminLayout title="Pagamento Online" subtitle="Ative ou desative o pagamento online">
      <div className="max-w-2xl">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><CreditCard className="h-6 w-6 text-primary" /></div>
            <div><h3 className="font-semibold">Pagamento Online</h3><p className="text-sm text-muted-foreground">Aceite pagamentos diretamente no app</p></div>
          </div>
          <StatusToggle checked={isActive} onCheckedChange={setIsActive} label="Ativar Pagamento Online" description="Clientes poderão pagar PIX ou cartão antes da entrega" activeLabel="Ativo" inactiveLabel="Desativado" />
        </div>
        {isActive && (
          <div className="card-premium p-6 mt-4">
            <p className="text-sm text-muted-foreground">Configure as integrações de pagamento em:</p>
            <ul className="mt-2 space-y-1 text-sm"><li>• Mercado Pago</li><li>• Formas de Pagamento</li><li>• Mensagens PIX</li></ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
