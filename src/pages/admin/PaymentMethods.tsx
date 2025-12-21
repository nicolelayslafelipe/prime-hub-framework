import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { Banknote, Loader2 } from 'lucide-react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

export default function AdminPaymentMethods() {
  const { methods, isLoading, isSaving, toggleMethod, updateMaxChange } = usePaymentMethods();

  if (isLoading) {
    return (
      <AdminLayout title="Formas de Pagamento" subtitle="Configure os métodos de pagamento aceitos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Formas de Pagamento" subtitle="Configure os métodos de pagamento aceitos">
      <div className="space-y-4 max-w-2xl">
        {methods.map(method => (
          <div key={method.id} className="card-premium p-4">
            <StatusToggle
              checked={method.is_active}
              onCheckedChange={() => toggleMethod(method.id)}
              label={`${method.icon || '💳'} ${method.name}`}
              activeLabel="Ativo"
              inactiveLabel="Desativado"
              disabled={isSaving}
            />
            {method.type === 'cash' && method.is_active && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Troco máximo</p>
                    <p className="text-xs text-muted-foreground">Valor máximo de troco disponível</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">R$</span>
                    <Input 
                      type="number" 
                      value={method.max_change || 200} 
                      onChange={e => updateMaxChange(method.id, Number(e.target.value))} 
                      className="w-24"
                      disabled={isSaving}
                    />
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
