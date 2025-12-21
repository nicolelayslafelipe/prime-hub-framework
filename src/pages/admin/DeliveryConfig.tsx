import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { DeliveryZoneForm } from '@/components/admin/DeliveryZoneForm';
import { DeliveryZoneList } from '@/components/admin/DeliveryZoneList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDeliveryConfig() {
  const { config, updateEstablishment, toggleDelivery, isLoading: configLoading } = useConfig();
  const { zones, isLoading: zonesLoading, addZone, updateZone, deleteZone, toggleZone } = useDeliveryZones();
  
  const [fee, setFee] = useState(0);
  const [time, setTime] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!configLoading) {
      setFee(config.establishment.deliveryFee);
      setTime(config.establishment.estimatedDeliveryTime);
      setMinOrder(config.establishment.minOrderValue);
    }
  }, [config.establishment, configLoading]);

  const handleSaveDefaults = async () => {
    setIsSaving(true);
    await updateEstablishment({ 
      deliveryFee: fee, 
      estimatedDeliveryTime: time, 
      minOrderValue: minOrder 
    });
    toast.success('Configurações padrão salvas!');
    setIsSaving(false);
  };

  if (configLoading) {
    return (
      <AdminLayout title="Configuração de Entrega" subtitle="Carregando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuração de Entrega" subtitle="Configure taxa, área e tempo de entrega">
      <div className="max-w-2xl space-y-6">
        {/* Delivery Toggle */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Delivery</h3>
              <p className="text-sm text-muted-foreground">Configure as opções de entrega</p>
            </div>
          </div>
          <StatusToggle 
            checked={config.establishment.isDeliveryEnabled} 
            onCheckedChange={toggleDelivery} 
            label="Delivery Ativo" 
            description="Ative ou desative o serviço de entrega" 
          />
        </div>

        {/* Default Settings */}
        <div className="card-premium p-6 space-y-4">
          <h4 className="font-medium">Configurações Padrão</h4>
          <p className="text-sm text-muted-foreground">
            Valores padrão para zonas que não têm configuração específica
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Taxa (R$)</label>
              <Input 
                type="number" 
                value={fee} 
                onChange={e => setFee(Number(e.target.value))} 
                min={0}
                step={0.5}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Tempo (min)</label>
              <Input 
                type="number" 
                value={time} 
                onChange={e => setTime(Number(e.target.value))} 
                min={0}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Mínimo (R$)</label>
              <Input 
                type="number" 
                value={minOrder} 
                onChange={e => setMinOrder(Number(e.target.value))} 
                min={0}
              />
            </div>
          </div>
          <Button onClick={handleSaveDefaults} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar Configurações Padrão
          </Button>
        </div>

        {/* Delivery Zones */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-medium">Zonas de Entrega</h4>
              <p className="text-sm text-muted-foreground">
                Configure bairros com taxas e tempos específicos
              </p>
            </div>
          </div>

          <DeliveryZoneForm 
            onAdd={addZone}
            defaultFee={fee}
            defaultMinOrder={minOrder}
            defaultTime={time}
          />

          {zonesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DeliveryZoneList
              zones={zones}
              defaultFee={fee}
              defaultMinOrder={minOrder}
              defaultTime={time}
              onToggle={toggleZone}
              onUpdate={updateZone}
              onDelete={deleteZone}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
