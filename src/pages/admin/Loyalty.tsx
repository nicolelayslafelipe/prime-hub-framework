import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { mockLoyaltyProgram } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Gift, Plus, Trash2 } from 'lucide-react';
import { LoyaltyReward } from '@/types';

export default function AdminLoyalty() {
  const [program, setProgram] = useState(mockLoyaltyProgram);

  const toggleReward = (id: string) => {
    setProgram(prev => ({ ...prev, rewards: prev.rewards.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r) }));
  };

  return (
    <AdminLayout title="Fidelidade" subtitle="Configure o programa de fidelidade">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><Gift className="h-6 w-6 text-primary" /></div>
            <div><h3 className="font-semibold">Programa de Fidelidade</h3><p className="text-sm text-muted-foreground">Recompense clientes frequentes</p></div>
          </div>
          <StatusToggle checked={program.isActive} onCheckedChange={v => setProgram(p => ({ ...p, isActive: v }))} label="Ativar Programa" description="Clientes acumulam pontos a cada compra" />
        </div>

        {program.isActive && (
          <>
            <div className="card-premium p-6 space-y-4">
              <h4 className="font-medium">Configurações de Pontos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-muted-foreground">Pontos por R$ 1,00</label><Input type="number" value={program.pointsPerReal} onChange={e => setProgram(p => ({ ...p, pointsPerReal: Number(e.target.value) }))} /></div>
                <div><label className="text-sm text-muted-foreground">Mínimo para resgate</label><Input type="number" value={program.minimumRedemption} onChange={e => setProgram(p => ({ ...p, minimumRedemption: Number(e.target.value) }))} /></div>
              </div>
            </div>

            <div className="card-premium p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Recompensas</h4>
                <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
              </div>
              <div className="space-y-3">
                {program.rewards.map(reward => (
                  <div key={reward.id} className={`p-4 rounded-lg border bg-muted/20 flex items-center gap-4 ${!reward.isActive && 'opacity-50'}`}>
                    <div className="flex-1"><p className="font-medium">{reward.name}</p><p className="text-sm text-muted-foreground">{reward.description}</p></div>
                    <span className="text-sm font-medium text-primary">{reward.pointsCost} pts</span>
                    <Switch checked={reward.isActive} onCheckedChange={() => toggleReward(reward.id)} />
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
