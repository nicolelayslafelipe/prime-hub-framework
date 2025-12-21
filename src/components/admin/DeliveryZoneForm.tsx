import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Search, Loader2 } from 'lucide-react';
import { fetchAddressByCep, formatCepForDisplay, isValidCep } from '@/lib/cep';
import { toast } from 'sonner';

interface DeliveryZoneFormProps {
  onAdd: (zone: { name: string; fee: number; min_order: number; estimated_time: number; is_active: boolean }) => Promise<boolean>;
  defaultFee: number;
  defaultMinOrder: number;
  defaultTime: number;
}

export function DeliveryZoneForm({ onAdd, defaultFee, defaultMinOrder, defaultTime }: DeliveryZoneFormProps) {
  const [cep, setCep] = useState('');
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number | ''>('');
  const [minOrder, setMinOrder] = useState<number | ''>('');
  const [estimatedTime, setEstimatedTime] = useState<number | ''>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleCepSearch = async () => {
    if (!isValidCep(cep)) {
      toast.error('CEP inválido. Digite 8 dígitos.');
      return;
    }

    setIsSearching(true);
    try {
      const address = await fetchAddressByCep(cep);
      if (address) {
        setName(address.neighborhood || address.city);
        toast.success('Bairro encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCepForDisplay(value);
    setCep(formatted);
  };

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
      setCep('');
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
      
      {/* CEP Search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Buscar por CEP</Label>
          <div className="flex gap-2">
            <Input
              value={cep}
              onChange={e => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={handleCepSearch}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Zone Name */}
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
