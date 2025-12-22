import { useState } from 'react';
import { Bell, Volume2, Play, Save, Loader2, Settings2, Bike, PlayCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSound, SoundSettings } from '@/contexts/SoundContext';
import { SOUND_OPTIONS, SoundType } from '@/lib/sounds';
import { toast } from 'sonner';
import { SoundIndicator } from '@/components/shared/SoundIndicator';
import { SoundPanelType } from '@/types';

export default function SoundSettingsPage() {
  const {
    adminSettings,
    kitchenSettings,
    motoboySettings,
    isLoading,
    updateSettings,
    previewSound,
    isPlayingAdmin,
    isPlayingKitchen,
    isPlayingMotoboy,
  } = useSound();

  const [localAdminSettings, setLocalAdminSettings] = useState<Partial<SoundSettings> | null>(null);
  const [localKitchenSettings, setLocalKitchenSettings] = useState<Partial<SoundSettings> | null>(null);
  const [localMotoboySettings, setLocalMotoboySettings] = useState<Partial<SoundSettings> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get merged settings (local changes over database values)
  const mergedAdminSettings = { ...adminSettings, ...localAdminSettings };
  const mergedKitchenSettings = { ...kitchenSettings, ...localKitchenSettings };
  const mergedMotoboySettings = { ...motoboySettings, ...localMotoboySettings };

  const handleSettingChange = (panel: SoundPanelType, key: keyof SoundSettings, value: unknown) => {
    if (panel === 'admin') {
      setLocalAdminSettings((prev) => ({ ...prev, [key]: value }));
    } else if (panel === 'kitchen') {
      setLocalKitchenSettings((prev) => ({ ...prev, [key]: value }));
    } else if (panel === 'motoboy') {
      setLocalMotoboySettings((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (localAdminSettings && Object.keys(localAdminSettings).length > 0) {
        await updateSettings('admin', localAdminSettings);
      }
      if (localKitchenSettings && Object.keys(localKitchenSettings).length > 0) {
        await updateSettings('kitchen', localKitchenSettings);
      }
      if (localMotoboySettings && Object.keys(localMotoboySettings).length > 0) {
        await updateSettings('motoboy', localMotoboySettings);
      }
      setLocalAdminSettings(null);
      setLocalKitchenSettings(null);
      setLocalMotoboySettings(null);
      toast.success('Configurações de som salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const testAllSounds = () => {
    const sounds: SoundType[] = ['bell', 'chime', 'ding-dong', 'kitchen-bell', 'alert', 'success'];
    let delay = 0;
    sounds.forEach((sound) => {
      setTimeout(() => {
        previewSound(sound, 0.7);
        toast.info(`Testando: ${SOUND_OPTIONS[sound].name}`, { duration: 1000 });
      }, delay);
      delay += 1500;
    });
  };

  const hasChanges =
    (localAdminSettings && Object.keys(localAdminSettings).length > 0) ||
    (localKitchenSettings && Object.keys(localKitchenSettings).length > 0) ||
    (localMotoboySettings && Object.keys(localMotoboySettings).length > 0);

  if (isLoading) {
    return (
      <AdminLayout title="Configurações de Som" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  // Render a panel settings card
  const renderPanelCard = (
    panel: SoundPanelType,
    title: string,
    description: string,
    icon: React.ReactNode,
    iconColor: string,
    settings: typeof mergedAdminSettings,
    isPlaying: boolean,
    showRepeat: boolean = false
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <SoundIndicator
          isPlaying={isPlaying}
          isEnabled={settings?.enabled ?? true}
          size="lg"
          showLabel
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={`${panel}-enabled`}>Ativar som</Label>
            <p className="text-sm text-muted-foreground">
              Tocar som para eventos deste painel
            </p>
          </div>
          <Switch
            id={`${panel}-enabled`}
            checked={settings?.enabled ?? true}
            onCheckedChange={(checked) => handleSettingChange(panel, 'enabled', checked)}
          />
        </div>

        {/* Sound type */}
        <div className="space-y-2">
          <Label>Tipo de Som</Label>
          <div className="flex items-center gap-2">
            <Select
              value={settings?.sound_type ?? 'bell'}
              onValueChange={(value) => handleSettingChange(panel, 'sound_type', value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOUND_OPTIONS).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.name}</span>
                      <span className="text-muted-foreground text-xs">
                        - {option.description}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                previewSound(
                  (settings?.sound_type as SoundType) ?? 'bell',
                  settings?.volume ?? 0.7
                )
              }
              title="Testar som"
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round((settings?.volume ?? 0.7) * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[(settings?.volume ?? 0.7) * 100]}
              onValueChange={([value]) => handleSettingChange(panel, 'volume', value / 100)}
              max={100}
              step={5}
              className="flex-1"
            />
          </div>
        </div>

        {/* Anti-spam interval */}
        <div className="space-y-2">
          <Label htmlFor={`${panel}-interval`}>Intervalo mínimo entre sons</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`${panel}-interval`}
              type="number"
              min={1}
              max={60}
              value={settings?.min_interval_seconds ?? 3}
              onChange={(e) =>
                handleSettingChange(panel, 'min_interval_seconds', parseInt(e.target.value) || 3)
              }
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">segundos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Previne múltiplos sons em sequência rápida (anti-spam)
          </p>
        </div>

        {/* Repeat settings (for kitchen only) */}
        {showRepeat && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={`${panel}-repeat`}>Repetir som até interagir</Label>
                <p className="text-sm text-muted-foreground">
                  Continua alertando até que alguém atenda o pedido
                </p>
              </div>
              <Switch
                id={`${panel}-repeat`}
                checked={settings?.repeat_enabled ?? true}
                onCheckedChange={(checked) => handleSettingChange(panel, 'repeat_enabled', checked)}
              />
            </div>

            {settings?.repeat_enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="repeat-interval">Intervalo de repetição</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="repeat-interval"
                      type="number"
                      min={10}
                      max={120}
                      value={settings?.repeat_interval_seconds ?? 30}
                      onChange={(e) =>
                        handleSettingChange(panel, 'repeat_interval_seconds', parseInt(e.target.value) || 30)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">segundos</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-repeat">Tempo máximo de alerta</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="max-repeat"
                      type="number"
                      min={1}
                      max={30}
                      value={Math.round((settings?.max_repeat_duration_seconds ?? 300) / 60)}
                      onChange={(e) =>
                        handleSettingChange(panel, 'max_repeat_duration_seconds', (parseInt(e.target.value) || 5) * 60)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Após este tempo, o alerta para automaticamente
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout
      title="Configurações de Som"
      subtitle="Gerencie os alertas sonoros do sistema"
    >
      <div className="space-y-6">
        {/* Test all sounds button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={testAllSounds} className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Testar Todos os Sons
          </Button>
        </div>

        {/* Admin Panel Settings */}
        {renderPanelCard(
          'admin',
          'Painel Admin',
          'Som para novos pedidos e atualizações no painel administrativo',
          <Settings2 className="h-5 w-5 text-primary" />,
          'text-primary',
          mergedAdminSettings,
          isPlayingAdmin
        )}

        {/* Kitchen Panel Settings */}
        {renderPanelCard(
          'kitchen',
          'Painel Cozinha',
          'Som para pedidos na cozinha com opção de repetição',
          <Bell className="h-5 w-5 text-accent" />,
          'text-accent',
          mergedKitchenSettings,
          isPlayingKitchen,
          true // Show repeat settings
        )}

        {/* Motoboy Panel Settings */}
        {motoboySettings && renderPanelCard(
          'motoboy',
          'Painel Motoboy',
          'Som para pedidos disponíveis e atribuídos ao motoboy',
          <Bike className="h-5 w-5 text-primary" />,
          'text-primary',
          mergedMotoboySettings,
          isPlayingMotoboy
        )}

        {/* Info if motoboy settings not configured */}
        {!motoboySettings && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Bike className="h-5 w-5" />
                Painel Motoboy
              </CardTitle>
              <CardDescription>
                As configurações de som para motoboy serão criadas automaticamente quando necessário.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="lg"
            className="min-w-[200px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
