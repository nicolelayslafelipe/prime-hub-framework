import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminSettings } from '@/hooks/useAdminSettings';

const days = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

type OperatingHours = Record<string, DayHours>;

const defaultHours: OperatingHours = {
  monday: { open: '08:00', close: '22:00', isOpen: true },
  tuesday: { open: '08:00', close: '22:00', isOpen: true },
  wednesday: { open: '08:00', close: '22:00', isOpen: true },
  thursday: { open: '08:00', close: '22:00', isOpen: true },
  friday: { open: '08:00', close: '22:00', isOpen: true },
  saturday: { open: '09:00', close: '23:00', isOpen: true },
  sunday: { open: '09:00', close: '20:00', isOpen: true },
};

export default function AdminBusinessHours() {
  const { value: savedHours, updateValue, isLoading, isSaving } = useAdminSettings<OperatingHours>('operating_hours', defaultHours);
  const [hours, setHours] = useState<OperatingHours>(defaultHours);

  useEffect(() => {
    if (savedHours) {
      setHours(savedHours);
    }
  }, [savedHours]);

  const updateDay = (day: string, field: string, value: any) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const applyToAll = () => {
    const first = hours.monday;
    const newHours: OperatingHours = {};
    days.forEach(d => { newHours[d.key] = { ...first }; });
    setHours(newHours);
    toast.success('Horário aplicado a todos os dias');
  };

  const handleSave = async () => {
    await updateValue(hours);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Horários" subtitle="Configure os horários de funcionamento">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Horários" subtitle="Configure os horários de funcionamento">
      <div className="max-w-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">Defina o horário para cada dia</span>
          </div>
          <Button variant="outline" size="sm" onClick={applyToAll}>
            Aplicar segunda para todos
          </Button>
        </div>

        {days.map(day => (
          <div key={day.key} className={`card-premium p-4 flex items-center gap-4 ${!hours[day.key]?.isOpen && 'opacity-60'}`}>
            <Switch 
              checked={hours[day.key]?.isOpen} 
              onCheckedChange={v => updateDay(day.key, 'isOpen', v)} 
            />
            <span className="w-32 font-medium">{day.label}</span>
            <div className="flex items-center gap-2 flex-1">
              <Input 
                type="time" 
                value={hours[day.key]?.open || '08:00'} 
                onChange={e => updateDay(day.key, 'open', e.target.value)} 
                className="w-28" 
                disabled={!hours[day.key]?.isOpen} 
              />
              <span className="text-muted-foreground">até</span>
              <Input 
                type="time" 
                value={hours[day.key]?.close || '22:00'} 
                onChange={e => updateDay(day.key, 'close', e.target.value)} 
                className="w-28" 
                disabled={!hours[day.key]?.isOpen} 
              />
            </div>
          </div>
        ))}

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : 'Salvar Horários'}
        </Button>
      </div>
    </AdminLayout>
  );
}
