import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { 
  Store, 
  RotateCcw, 
  Image, 
  Megaphone, 
  Loader2, 
  Check, 
  MapPin, 
  Clock, 
  Truck,
  Star,
  Phone,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function AdminSystem() {
  const { config, isLoading, error, updateEstablishment, refetch } = useConfig();
  
  // Identity
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  
  // Status
  const [isOpen, setIsOpen] = useState(true);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true);
  
  // Contact
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  
  // Delivery
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(45);
  const [deliveryFee, setDeliveryFee] = useState(5);
  const [minOrderValue, setMinOrderValue] = useState(20);
  
  // Rating
  const [averageRating, setAverageRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  // Banner
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
      setIsOpen(config.establishment.isOpen);
      setIsDeliveryEnabled(config.establishment.isDeliveryEnabled);
      setPhone(config.establishment.phone || '');
      setWhatsapp(config.establishment.whatsapp || '');
      setAddress(config.establishment.address || '');
      setEstimatedDeliveryTime(config.establishment.estimatedDeliveryTime || 45);
      setDeliveryFee(config.establishment.deliveryFee || 5);
      setMinOrderValue(config.establishment.minOrderValue || 20);
      setAverageRating(config.establishment.averageRating || 5.0);
      setTotalReviews(config.establishment.totalReviews || 0);
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
        isOpen,
        isDeliveryEnabled,
        phone,
        whatsapp,
        address,
        estimatedDeliveryTime,
        deliveryFee,
        minOrderValue,
        averageRating,
        totalReviews,
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
      <AdminLayout title="Estabelecimento" subtitle="Configure as informações do seu estabelecimento">
        <LoadingState message="Carregando configurações..." size="lg" />
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout title="Estabelecimento" subtitle="Configure as informações do seu estabelecimento">
        <ErrorState 
          title="Erro ao carregar configurações"
          message={error}
          onRetry={refetch}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Estabelecimento" subtitle="Configure as informações do seu estabelecimento">
      <div className="max-w-2xl space-y-6">
        {/* Identity Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Identidade do Estabelecimento</h3>
              <p className="text-sm text-muted-foreground">Nome, descrição e logo</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nome do Estabelecimento</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Uma breve descrição do estabelecimento"
              rows={2}
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

        {/* Status Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Status de Funcionamento</h3>
              <p className="text-sm text-muted-foreground">Controle abertura e delivery</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Estabelecimento</span>
                <p className="text-xs text-muted-foreground">Aberto para pedidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isOpen ? 'default' : 'destructive'} className={isOpen ? 'bg-accent text-accent-foreground' : ''}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </Badge>
              <Switch checked={isOpen} onCheckedChange={setIsOpen} />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Delivery</span>
                <p className="text-xs text-muted-foreground">Entregas ativas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isDeliveryEnabled ? 'default' : 'secondary'} className={isDeliveryEnabled ? 'bg-primary text-primary-foreground' : ''}>
                {isDeliveryEnabled ? 'Ativo' : 'Pausado'}
              </Badge>
              <Switch checked={isDeliveryEnabled} onCheckedChange={setIsDeliveryEnabled} />
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Localização e Contato</h3>
              <p className="text-sm text-muted-foreground">Endereço e telefones</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Endereço Completo</label>
            <Textarea 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="Rua, número, bairro, cidade - estado"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                <Phone className="h-3.5 w-3.5 inline mr-1" />
                Telefone
              </label>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                WhatsApp
              </label>
              <Input 
                value={whatsapp} 
                onChange={e => setWhatsapp(e.target.value)} 
                placeholder="5511999999999"
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Truck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Configurações de Entrega</h3>
              <p className="text-sm text-muted-foreground">Tempo, taxa e pedido mínimo</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                Tempo Médio (min)
              </label>
              <Input 
                type="number"
                value={estimatedDeliveryTime} 
                onChange={e => setEstimatedDeliveryTime(Number(e.target.value))} 
                min={10}
                max={180}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                <DollarSign className="h-3.5 w-3.5 inline mr-1" />
                Taxa de Entrega (R$)
              </label>
              <Input 
                type="number"
                step="0.50"
                value={deliveryFee} 
                onChange={e => setDeliveryFee(Number(e.target.value))} 
                min={0}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Pedido Mínimo (R$)
              </label>
              <Input 
                type="number"
                step="1"
                value={minOrderValue} 
                onChange={e => setMinOrderValue(Number(e.target.value))} 
                min={0}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Para configurações avançadas de entrega por distância, acesse Configurações → Entrega
          </p>
        </div>

        {/* Rating Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Avaliação</h3>
              <p className="text-sm text-muted-foreground">Nota média e total de avaliações</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nota Média</label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number"
                  step="0.1"
                  value={averageRating} 
                  onChange={e => setAverageRating(Math.min(5, Math.max(0, Number(e.target.value))))} 
                  min={0}
                  max={5}
                  className="w-24"
                />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Total de Avaliações</label>
              <Input 
                type="number"
                value={totalReviews} 
                onChange={e => setTotalReviews(Math.max(0, Number(e.target.value)))} 
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Banner Settings */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Image className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Banner Promocional</h3>
              <p className="text-sm text-muted-foreground">Banner exibido no cardápio</p>
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
