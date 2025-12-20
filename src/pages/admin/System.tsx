import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Settings, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSystem() {
  const { config, updateEstablishment } = useConfig();
  const [name, setName] = useState(config.establishment.name);
  const [description, setDescription] = useState(config.establishment.description || '');
  const [logo, setLogo] = useState(config.establishment.logo || '');

  const handleSave = () => {
    updateEstablishment({ name, description, logo });
    toast.success('Configurações salvas!');
  };

  const clearCache = () => {
    localStorage.clear();
    toast.success('Cache limpo! Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <AdminLayout title="Sistema" subtitle="Configurações gerais do sistema">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10"><Settings className="h-6 w-6 text-primary" /></div>
            <div><h3 className="font-semibold">Identidade do Sistema</h3><p className="text-sm text-muted-foreground">Configure nome e logo</p></div>
          </div>
          <div><label className="text-sm text-muted-foreground">Nome do Sistema</label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="text-sm text-muted-foreground">Descrição</label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Uma breve descrição do estabelecimento" /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">Logo</label><ImageUpload value={logo} onChange={setLogo} onRemove={() => setLogo('')} aspectRatio="square" /></div>
          <Button onClick={handleSave} className="w-full">Salvar Alterações</Button>
        </div>

        <div className="card-premium p-6">
          <h4 className="font-medium mb-4">Manutenção</h4>
          <Button variant="outline" onClick={clearCache} className="gap-2"><RotateCcw className="h-4 w-4" />Limpar Cache</Button>
        </div>

        <div className="card-premium p-6">
          <h4 className="font-medium mb-2">Informações</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Versão: 1.0.0</p>
            <p>Ambiente: Desenvolvimento</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
