import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Gift, Plus, Loader2 } from 'lucide-react';
import { useLoyalty } from '@/hooks/useLoyalty';

export default function AdminLoyalty() {
  const { settings, rewards, isLoading, isSaving, updateSettings, toggleReward } = useLoyalty();

  if (isLoading || !settings) {
    return (
      <AdminLayout title="Fidelidade" subtitle="Configure o programa de fidelidade">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Fidelidade" subtitle="Configure o programa de fidelidade">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Programa de Fidelidade</h3>
              <p className="text-sm text-muted-foreground">Recompense clientes frequentes</p>
            </div>
          </div>
          <StatusToggle 
            checked={settings.is_active} 
            onCheckedChange={v => updateSettings({ is_active: v })} 
            label="Ativar Programa" 
            description="Clientes acumulam pontos a cada compra"
            disabled={isSaving}
          />
        </div>

        {settings.is_active && (
          <>
            <div className="card-premium p-6 space-y-4">
              <h4 className="font-medium">Configurações de Pontos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Pontos por R$ 1,00</label>
                  <Input 
                    type="number" 
                    value={settings.points_per_real} 
                    onChange={e => updateSettings({ points_per_real: Number(e.target.value) })}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Mínimo para resgate</label>
                  <Input 
                    type="number" 
                    value={settings.minimum_redemption} 
                    onChange={e => updateSettings({ minimum_redemption: Number(e.target.value) })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Recompensas</h4>
                <Button size="sm" variant="outline" className="gap-2" disabled={isSaving}>
                  <Plus className="h-4 w-4" />Adicionar
                </Button>
              </div>
              <div className="space-y-3">
                {rewards.map(reward => (
                  <div key={reward.id} className={`p-4 rounded-lg border bg-muted/20 flex items-center gap-4 ${!reward.is_active && 'opacity-50'}`}>
                    <div className="flex-1">
                      <p className="font-medium">{reward.name}</p>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{reward.points_cost} pts</span>
                    <Switch 
                      checked={reward.is_active} 
                      onCheckedChange={() => toggleReward(reward.id)}
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
