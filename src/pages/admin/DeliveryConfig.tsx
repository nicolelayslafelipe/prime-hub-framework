import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { DeliveryZoneForm } from '@/components/admin/DeliveryZoneForm';
import { DeliveryZoneList } from '@/components/admin/DeliveryZoneList';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { GeocodedAddress } from '@/hooks/useAddressSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Truck, MapPin, Loader2, Calculator, Navigation, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDeliveryConfig() {
  const { config, updateEstablishment, toggleDelivery, isLoading: configLoading } = useConfig();
  const { zones, isLoading: zonesLoading, addZone, updateZone, deleteZone, toggleZone } = useDeliveryZones();
  
  // Default settings
  const [fee, setFee] = useState(0);
  const [time, setTime] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  
  // Distance-based fee settings
  const [distanceFeeEnabled, setDistanceFeeEnabled] = useState(false);
  const [baseFee, setBaseFee] = useState(5);
  const [pricePerKm, setPricePerKm] = useState(2);
  const [minDistanceIncluded, setMinDistanceIncluded] = useState(2);
  const [maxDeliveryRadius, setMaxDeliveryRadius] = useState(10);
  const [establishmentLat, setEstablishmentLat] = useState<number | null>(null);
  const [establishmentLng, setEstablishmentLng] = useState<number | null>(null);
  const [establishmentAddress, setEstablishmentAddress] = useState('');
  
  // ETA settings
  const [averagePrepTime, setAveragePrepTime] = useState(15);
  const [peakTimeAdjustment, setPeakTimeAdjustment] = useState(10);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!configLoading) {
      setFee(config.establishment.deliveryFee);
      setTime(config.establishment.estimatedDeliveryTime);
      setMinOrder(config.establishment.minOrderValue);
      
      // Distance-based fee settings
      setDistanceFeeEnabled(config.establishment.distanceFeeEnabled || false);
      setBaseFee(config.establishment.baseDeliveryFee || 5);
      setPricePerKm(config.establishment.pricePerKm || 2);
      setMinDistanceIncluded(config.establishment.minDistanceIncluded || 2);
      setMaxDeliveryRadius(config.establishment.maxDeliveryRadius || 10);
      setEstablishmentLat(config.establishment.establishmentLatitude || null);
      setEstablishmentLng(config.establishment.establishmentLongitude || null);
      setEstablishmentAddress(config.establishment.address || '');
      // ETA settings
      setAveragePrepTime(config.establishment.averagePrepTime || 15);
      setPeakTimeAdjustment(config.establishment.peakTimeAdjustment || 10);
    }
  }, [config.establishment, configLoading]);

  const handleAddressSelect = useCallback((address: GeocodedAddress) => {
    setEstablishmentLat(address.latitude);
    setEstablishmentLng(address.longitude);
    const fullAddress = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`;
    setEstablishmentAddress(fullAddress);
    toast.success('Localização do estabelecimento definida!');
  }, []);

  const handleSaveDefaults = async () => {
    setIsSaving(true);
    try {
      await updateEstablishment({ 
        deliveryFee: fee, 
        estimatedDeliveryTime: time, 
        minOrderValue: minOrder 
      });
      toast.success('Configurações padrão salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDistanceFee = async () => {
    if (distanceFeeEnabled && (!establishmentLat || !establishmentLng)) {
      toast.error('Defina a localização do estabelecimento para usar taxa por distância');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateEstablishment({ 
        distanceFeeEnabled,
        baseDeliveryFee: baseFee,
        pricePerKm,
        minDistanceIncluded,
        maxDeliveryRadius,
        establishmentLatitude: establishmentLat || undefined,
        establishmentLongitude: establishmentLng || undefined,
        address: establishmentAddress || config.establishment.address,
        averagePrepTime,
        peakTimeAdjustment,
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate example fee
  const calculateExampleFee = (distance: number) => {
    if (distance <= minDistanceIncluded) {
      return baseFee;
    }
    const extraDistance = distance - minDistanceIncluded;
    return baseFee + (extraDistance * pricePerKm);
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

        {/* Distance-Based Fee */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Taxa por Distância</h4>
              <p className="text-sm text-muted-foreground">
                Calcular taxa automaticamente com base na distância
              </p>
            </div>
            <Switch
              checked={distanceFeeEnabled}
              onCheckedChange={setDistanceFeeEnabled}
            />
          </div>

          {distanceFeeEnabled && (
            <div className="space-y-4 pt-4 border-t border-border animate-fade-in">
              {/* Establishment Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Localização do Estabelecimento
                </Label>
                <AddressAutocomplete
                  placeholder="Buscar endereço do estabelecimento..."
                  onAddressSelect={handleAddressSelect}
                />
                {establishmentLat && establishmentLng && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Endereço selecionado:</p>
                    <p className="text-sm font-medium">{establishmentAddress}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordenadas: {establishmentLat.toFixed(6)}, {establishmentLng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Fee Configuration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Taxa Base (R$)</Label>
                  <Input 
                    type="number" 
                    value={baseFee} 
                    onChange={e => setBaseFee(Number(e.target.value))} 
                    min={0}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor mínimo cobrado
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Valor/KM (R$)</Label>
                  <Input 
                    type="number" 
                    value={pricePerKm} 
                    onChange={e => setPricePerKm(Number(e.target.value))} 
                    min={0}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Por km adicional
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Distância Inclusa (km)</Label>
                  <Input 
                    type="number" 
                    value={minDistanceIncluded} 
                    onChange={e => setMinDistanceIncluded(Number(e.target.value))} 
                    min={0}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sem custo extra
                  </p>
                </div>
              </div>

              {/* Max Delivery Radius */}
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-destructive" />
                  <div>
                    <h5 className="text-sm font-medium">Área Máxima de Entrega</h5>
                    <p className="text-xs text-muted-foreground">
                      Pedidos fora deste raio serão bloqueados
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number" 
                    value={maxDeliveryRadius} 
                    onChange={e => setMaxDeliveryRadius(Number(e.target.value))} 
                    min={1}
                    max={50}
                    step={1}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
              </div>

              {/* Example Calculations */}
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h5 className="text-sm font-medium mb-3">Exemplos de cálculo:</h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[2, 5, 10].map(distance => (
                    <div key={distance} className={`p-2 rounded ${distance > maxDeliveryRadius ? 'bg-destructive/10 border border-destructive/20' : 'bg-background'}`}>
                      <p className="text-xs text-muted-foreground">{distance} km</p>
                      {distance > maxDeliveryRadius ? (
                        <p className="text-sm font-medium text-destructive">Fora da área</p>
                      ) : (
                        <p className="text-lg font-bold text-primary">
                          R$ {calculateExampleFee(distance).toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Fórmula: Taxa Base + (Distância - {minDistanceIncluded}km) × R$ {pricePerKm}/km
                </p>
              </div>

              {/* ETA Configuration */}
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <h5 className="text-sm font-medium">Tempo Estimado (ETA)</h5>
                    <p className="text-xs text-muted-foreground">
                      Tempo de preparo + deslocamento calculado pelo Mapbox
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Tempo de Preparo (min)</Label>
                    <Input 
                      type="number" 
                      value={averagePrepTime} 
                      onChange={e => setAveragePrepTime(Number(e.target.value))} 
                      min={5}
                      max={120}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo médio para preparar pedidos
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Ajuste Horário de Pico (min)</Label>
                    <Input 
                      type="number" 
                      value={peakTimeAdjustment} 
                      onChange={e => setPeakTimeAdjustment(Number(e.target.value))} 
                      min={0}
                      max={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo extra em horários movimentados
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    <strong>Exemplo:</strong> Preparo ({averagePrepTime} min) + Deslocamento (~15 min) = <span className="font-semibold text-primary">{averagePrepTime + 15}-{averagePrepTime + 25} min</span>
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveDistanceFee} disabled={isSaving} className="w-full">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Configurações
              </Button>
            </div>
          )}
        </div>

        {/* Default Settings (when distance fee is disabled) */}
        {!distanceFeeEnabled && (
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
        )}

        {/* Delivery Zones (only show when distance fee is disabled) */}
        {!distanceFeeEnabled && (
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
        )}
      </div>
    </AdminLayout>
  );
}
