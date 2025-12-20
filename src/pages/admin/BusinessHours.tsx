import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

const days = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export default function AdminBusinessHours() {
  const { config, updateEstablishment } = useConfig();
  const [hours, setHours] = useState(config.establishment.operatingHours);

  const updateDay = (day: string, field: string, value: any) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const applyToAll = () => {
    const first = hours.monday;
    const newHours: any = {};
    days.forEach(d => { newHours[d.key] = { ...first }; });
    setHours(newHours);
    toast.success('Horário aplicado a todos os dias');
  };

  const handleSave = () => {
    updateEstablishment({ operatingHours: hours });
    toast.success('Horários salvos!');
  };

  return (
    <AdminLayout title="Horários" subtitle="Configure os horários de funcionamento">
      <div className="max-w-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span className="text-muted-foreground">Defina o horário para cada dia</span></div>
          <Button variant="outline" size="sm" onClick={applyToAll}>Aplicar segunda para todos</Button>
        </div>

        {days.map(day => (
          <div key={day.key} className={`card-premium p-4 flex items-center gap-4 ${!hours[day.key]?.isOpen && 'opacity-60'}`}>
            <Switch checked={hours[day.key]?.isOpen} onCheckedChange={v => updateDay(day.key, 'isOpen', v)} />
            <span className="w-32 font-medium">{day.label}</span>
            <div className="flex items-center gap-2 flex-1">
              <Input type="time" value={hours[day.key]?.open || '11:00'} onChange={e => updateDay(day.key, 'open', e.target.value)} className="w-28" disabled={!hours[day.key]?.isOpen} />
              <span className="text-muted-foreground">até</span>
              <Input type="time" value={hours[day.key]?.close || '23:00'} onChange={e => updateDay(day.key, 'close', e.target.value)} className="w-28" disabled={!hours[day.key]?.isOpen} />
            </div>
          </div>
        ))}

        <Button onClick={handleSave} className="w-full">Salvar Horários</Button>
      </div>
    </AdminLayout>
  );
}
