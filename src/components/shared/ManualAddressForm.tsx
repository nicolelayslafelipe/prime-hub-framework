import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Check } from 'lucide-react';

interface ManualAddressData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ManualAddressFormProps {
  onSubmit: (address: ManualAddressData) => void;
  onCancel?: () => void;
  initialData?: Partial<ManualAddressData>;
}

export function ManualAddressForm({ onSubmit, onCancel, initialData }: ManualAddressFormProps) {
  const [formData, setFormData] = useState<ManualAddressData>({
    street: initialData?.street || '',
    number: initialData?.number || '',
    complement: initialData?.complement || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || 'SP',
    zipCode: initialData?.zipCode || '',
  });

  const handleChange = (field: keyof ManualAddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.street && formData.number && formData.neighborhood && formData.city;

  return (
    <Card className="border-dashed border-2 border-border">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Preencher endereço manualmente</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="street" className="text-xs">Rua *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Nome da rua"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="number" className="text-xs">Número *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="Nº"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="complement" className="text-xs">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => handleChange('complement', e.target.value)}
                placeholder="Apto, bloco..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood" className="text-xs">Bairro *</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Bairro"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="zipCode" className="text-xs">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                placeholder="00000-000"
                className="h-9"
              />
            </div>
            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="city" className="text-xs">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="UF"
                maxLength={2}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!isValid} 
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              Confirmar Endereço
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
