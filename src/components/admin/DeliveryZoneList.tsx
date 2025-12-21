import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Check, X, MapPin, Clock, DollarSign } from 'lucide-react';
import type { DeliveryZone } from '@/hooks/useDeliveryZones';

interface DeliveryZoneListProps {
  zones: DeliveryZone[];
  defaultFee: number;
  defaultMinOrder: number;
  defaultTime: number;
  onToggle: (id: string) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<DeliveryZone>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function DeliveryZoneList({ 
  zones, 
  defaultFee, 
  defaultMinOrder, 
  defaultTime,
  onToggle, 
  onUpdate, 
  onDelete 
}: DeliveryZoneListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DeliveryZone>>({});

  const startEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setEditData({
      name: zone.name,
      fee: zone.fee,
      min_order: zone.min_order,
      estimated_time: zone.estimated_time
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id: string) => {
    await onUpdate(id, editData);
    setEditingId(null);
    setEditData({});
  };

  const getDisplayFee = (zone: DeliveryZone) => 
    zone.fee > 0 ? zone.fee : defaultFee;
  
  const getDisplayMinOrder = (zone: DeliveryZone) => 
    zone.min_order > 0 ? zone.min_order : defaultMinOrder;
  
  const getDisplayTime = (zone: DeliveryZone) => 
    zone.estimated_time > 0 ? zone.estimated_time : defaultTime;

  if (zones.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma zona de entrega cadastrada</p>
        <p className="text-xs">Use o formulário acima para adicionar bairros</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {zones.map(zone => (
        <div 
          key={zone.id} 
          className={`p-3 rounded-lg border transition-colors ${
            zone.is_active 
              ? 'bg-card border-border' 
              : 'bg-muted/30 border-border/50 opacity-60'
          }`}
        >
          {editingId === zone.id ? (
            <div className="space-y-3">
              <Input
                value={editData.name || ''}
                onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do bairro"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={editData.fee || ''}
                  onChange={e => setEditData(prev => ({ ...prev, fee: Number(e.target.value) }))}
                  placeholder={`Taxa: ${defaultFee}`}
                />
                <Input
                  type="number"
                  value={editData.min_order || ''}
                  onChange={e => setEditData(prev => ({ ...prev, min_order: Number(e.target.value) }))}
                  placeholder={`Mín: ${defaultMinOrder}`}
                />
                <Input
                  type="number"
                  value={editData.estimated_time || ''}
                  onChange={e => setEditData(prev => ({ ...prev, estimated_time: Number(e.target.value) }))}
                  placeholder={`Tempo: ${defaultTime}`}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => saveEdit(zone.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={zone.is_active}
                  onCheckedChange={() => onToggle(zone.id)}
                />
                <div>
                  <p className="font-medium text-sm">{zone.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {getDisplayFee(zone).toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getDisplayTime(zone)} min
                    </span>
                    <span>Mín: R$ {getDisplayMinOrder(zone).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => startEdit(zone)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(zone.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
