import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck } from 'lucide-react';

export default function AdminFirstOrderVerification() {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('Por ser seu primeiro pedido, precisamos confirmar alguns dados por segurança. Por favor, aguarde nosso contato.');

  return (
    <AdminLayout title="Verificação Primeiro Pedido" subtitle="Configure a verificação antifraude">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
            <div><h3 className="font-semibold">Verificação de Primeiro Pedido</h3><p className="text-sm text-muted-foreground">Proteção contra fraudes</p></div>
          </div>
          <StatusToggle checked={isActive} onCheckedChange={setIsActive} label="Ativar Verificação" description="Verificar novos clientes antes do primeiro pedido" />
        </div>

        {isActive && (
          <div className="card-premium p-6">
            <h4 className="font-medium mb-3">Mensagem de Verificação</h4>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Mensagem exibida ao cliente..." />
            <p className="text-sm text-muted-foreground mt-2">Exibida quando um novo cliente faz o primeiro pedido</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
