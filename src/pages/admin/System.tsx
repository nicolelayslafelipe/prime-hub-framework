import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Settings, RotateCcw, Image, Megaphone, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSystem() {
  const { config, isLoading, error, updateEstablishment, refetch } = useConfig();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form state with config when loaded
  useEffect(() => {
    if (!isLoading && config.establishment) {
      setName(config.establishment.name || '');
      setDescription(config.establishment.description || '');
      setLogo(config.establishment.logo || '');
      setBanner(config.establishment.banner || '');
      setBannerText(config.establishment.bannerText || '');
      setShowBanner(config.establishment.showBanner || false);
    }
  }, [isLoading, config.establishment]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await updateEstablishment({ 
        name, 
        description, 
        logo,
        banner,
        bannerText,
        showBanner,
      });
      toast.success('Configurações salvas com sucesso!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const clearCache = () => {
    localStorage.clear();
    toast.success('Cache limpo! Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout title="Sistema" subtitle="Configurações gerais do sistema">
        <LoadingState message="Carregando configurações..." size="lg" />
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout title="Sistema" subtitle="Configurações gerais do sistema">
        <ErrorState 
          title="Erro ao carregar configurações"
          message={error}
          onRetry={refetch}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sistema" subtitle="Configurações gerais do sistema">
      <div className="max-w-2xl space-y-6">
        {/* Identity Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Identidade do Sistema</h3>
              <p className="text-sm text-muted-foreground">Configure nome e logo</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nome do Estabelecimento</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
            <Input 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Uma breve descrição do estabelecimento" 
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Logo</label>
            <p className="text-xs text-muted-foreground mb-2">
              Tamanho recomendado: 200x200px. Formatos: PNG, JPG ou WEBP
            </p>
            <ImageUpload 
              value={logo} 
              onChange={setLogo} 
              onRemove={() => setLogo('')} 
              aspectRatio="square"
              bucket="branding"
              path="logo"
              placeholder="Upload da logo"
            />
          </div>
        </div>

        {/* Banner Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Image className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Banner Principal</h3>
              <p className="text-sm text-muted-foreground">Banner promocional no cardápio</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {showBanner ? 'Ativo' : 'Inativo'}
              </span>
              <Switch 
                checked={showBanner} 
                onCheckedChange={setShowBanner}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Imagem do Banner</label>
            <p className="text-xs text-muted-foreground mb-2">
              Tamanho recomendado: 1200x400px (proporção 3:1)
            </p>
            <ImageUpload 
              value={banner} 
              onChange={setBanner} 
              onRemove={() => setBanner('')} 
              aspectRatio="banner"
              bucket="branding"
              path="banner"
              placeholder="Upload do banner"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              <Megaphone className="h-4 w-4 inline mr-1" />
              Texto Promocional (opcional)
            </label>
            <Textarea 
              value={bannerText} 
              onChange={e => setBannerText(e.target.value)} 
              placeholder="Ex: 🔥 Promoção de Inauguração! 20% OFF em todos os burgers"
              rows={2}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full gap-2" 
          size="lg"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Salvo!
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>

        {/* Maintenance */}
        <div className="card-premium p-6">
          <h4 className="font-medium mb-4">Manutenção</h4>
          <Button variant="outline" onClick={clearCache} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Limpar Cache
          </Button>
        </div>

        {/* Info */}
        <div className="card-premium p-6">
          <h4 className="font-medium mb-2">Informações</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Versão: 1.0.0</p>
            <p>Ambiente: Produção</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
