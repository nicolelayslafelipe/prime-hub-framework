import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDeliveryConfig() {
  const { config, updateEstablishment, toggleDelivery } = useConfig();
  const [fee, setFee] = useState(config.establishment.deliveryFee);
  const [time, setTime] = useState(config.establishment.estimatedDeliveryTime);
  const [minOrder, setMinOrder] = useState(config.establishment.minOrderValue);
  const [area, setArea] = useState(config.establishment.deliveryArea || '');

  const handleSave = () => {
    updateEstablishment({ deliveryFee: fee, estimatedDeliveryTime: time, minOrderValue: minOrder, deliveryArea: area });
    toast.success('Configurações de entrega salvas!');
  };

  return (
    <AdminLayout title="Configuração de Entrega" subtitle="Configure taxa, área e tempo de entrega">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><Truck className="h-6 w-6 text-primary" /></div>
            <div><h3 className="font-semibold">Delivery</h3><p className="text-sm text-muted-foreground">Configure as opções de entrega</p></div>
          </div>
          <StatusToggle checked={config.establishment.isDeliveryEnabled} onCheckedChange={toggleDelivery} label="Delivery Ativo" description="Ative ou desative o serviço de entrega" />
        </div>

        <div className="card-premium p-6 space-y-4">
          <h4 className="font-medium">Configurações</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-muted-foreground">Taxa de Entrega (R$)</label><Input type="number" value={fee} onChange={e => setFee(Number(e.target.value))} /></div>
            <div><label className="text-sm text-muted-foreground">Tempo Estimado (min)</label><Input type="number" value={time} onChange={e => setTime(Number(e.target.value))} /></div>
          </div>
          <div><label className="text-sm text-muted-foreground">Pedido Mínimo (R$)</label><Input type="number" value={minOrder} onChange={e => setMinOrder(Number(e.target.value))} /></div>
          <div><label className="text-sm text-muted-foreground">Área de Entrega</label><Textarea value={area} onChange={e => setArea(e.target.value)} placeholder="Ex: Centro, Jardins, Vila Mariana..." rows={3} /></div>
          <Button onClick={handleSave} className="w-full">Salvar Configurações</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
