import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryZoneFormProps {
  onAdd: (zone: { name: string; fee: number; min_order: number; estimated_time: number; is_active: boolean }) => Promise<boolean>;
  defaultFee: number;
  defaultMinOrder: number;
  defaultTime: number;
}

export function DeliveryZoneForm({ onAdd, defaultFee, defaultMinOrder, defaultTime }: DeliveryZoneFormProps) {
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number | ''>('');
  const [minOrder, setMinOrder] = useState<number | ''>('');
  const [estimatedTime, setEstimatedTime] = useState<number | ''>('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Digite o nome do bairro/zona');
      return;
    }

    setIsAdding(true);
    const success = await onAdd({
      name: name.trim(),
      fee: fee === '' ? defaultFee : fee,
      min_order: minOrder === '' ? defaultMinOrder : minOrder,
      estimated_time: estimatedTime === '' ? defaultTime : estimatedTime,
      is_active: true
    });

    if (success) {
      setName('');
      setFee('');
      setMinOrder('');
      setEstimatedTime('');
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      <h4 className="font-medium text-sm">Adicionar Zona de Entrega</h4>

      {/* Zone Name */}
      <div>
        <Label className="text-xs text-muted-foreground">Nome do Bairro/Zona *</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Centro, Jardins, Vila Nova..."
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Nome do Bairro/Zona *</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Centro, Jardins, Vila Nova..."
        />
      </div>

      {/* Fee, Min Order, Time */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Taxa (R$)</Label>
          <Input
            type="number"
            value={fee}
            onChange={e => setFee(e.target.value ? Number(e.target.value) : '')}
            placeholder={`${defaultFee}`}
            min={0}
            step={0.5}
          />
          <span className="text-[10px] text-muted-foreground">Vazio = padrão</span>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Mínimo (R$)</Label>
          <Input
            type="number"
            value={minOrder}
            onChange={e => setMinOrder(e.target.value ? Number(e.target.value) : '')}
            placeholder={`${defaultMinOrder}`}
            min={0}
          />
          <span className="text-[10px] text-muted-foreground">Vazio = padrão</span>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tempo (min)</Label>
          <Input
            type="number"
            value={estimatedTime}
            onChange={e => setEstimatedTime(e.target.value ? Number(e.target.value) : '')}
            placeholder={`${defaultTime}`}
            min={0}
          />
          <span className="text-[10px] text-muted-foreground">Vazio = padrão</span>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isAdding} className="w-full">
        {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Adicionar Zona
      </Button>
    </div>
  );
}
