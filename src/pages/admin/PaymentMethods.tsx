import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { mockPaymentMethods } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { CreditCard, Banknote } from 'lucide-react';

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState(mockPaymentMethods);
  const [maxChange, setMaxChange] = useState(200);

  const toggleMethod = (id: string) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  return (
    <AdminLayout title="Formas de Pagamento" subtitle="Configure os métodos de pagamento aceitos">
      <div className="space-y-4 max-w-2xl">
        {methods.map(method => (
          <div key={method.id} className="card-premium p-4">
            <StatusToggle
              checked={method.isActive}
              onCheckedChange={() => toggleMethod(method.id)}
              label={`${method.icon} ${method.name}`}
              activeLabel="Ativo"
              inactiveLabel="Desativado"
            />
            {method.type === 'cash' && method.isActive && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Troco máximo</p>
                    <p className="text-xs text-muted-foreground">Valor máximo de troco disponível</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">R$</span>
                    <Input type="number" value={maxChange} onChange={e => setMaxChange(Number(e.target.value))} className="w-24" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
