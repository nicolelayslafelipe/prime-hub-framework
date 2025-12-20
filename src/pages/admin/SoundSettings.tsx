import { useState } from 'react';
import { Bell, Volume2, Play, Save, Loader2, Settings2 } from 'lucide-react';
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

export default function SoundSettingsPage() {
  const {
    adminSettings,
    kitchenSettings,
    isLoading,
    updateSettings,
    previewSound,
    isPlayingAdmin,
    isPlayingKitchen,
  } = useSound();

  const [localAdminSettings, setLocalAdminSettings] = useState<Partial<SoundSettings> | null>(null);
  const [localKitchenSettings, setLocalKitchenSettings] = useState<Partial<SoundSettings> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get merged settings (local changes over database values)
  const mergedAdminSettings = { ...adminSettings, ...localAdminSettings };
  const mergedKitchenSettings = { ...kitchenSettings, ...localKitchenSettings };

  const handleAdminChange = (key: keyof SoundSettings, value: unknown) => {
    setLocalAdminSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleKitchenChange = (key: keyof SoundSettings, value: unknown) => {
    setLocalKitchenSettings((prev) => ({ ...prev, [key]: value }));
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
      setLocalAdminSettings(null);
      setLocalKitchenSettings(null);
      toast.success('Configurações de som salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    (localAdminSettings && Object.keys(localAdminSettings).length > 0) ||
    (localKitchenSettings && Object.keys(localKitchenSettings).length > 0);

  if (isLoading) {
    return (
      <AdminLayout title="Configurações de Som" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Configurações de Som"
      subtitle="Gerencie os alertas sonoros do sistema"
    >
      <div className="space-y-6">
        {/* Admin Panel Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Painel Admin
              </CardTitle>
              <CardDescription>
                Som para novos pedidos no painel administrativo
              </CardDescription>
            </div>
            <SoundIndicator
              isPlaying={isPlayingAdmin}
              isEnabled={mergedAdminSettings?.enabled ?? true}
              size="lg"
              showLabel
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin-enabled">Ativar som de novo pedido</Label>
                <p className="text-sm text-muted-foreground">
                  Tocar som quando um novo pedido for criado
                </p>
              </div>
              <Switch
                id="admin-enabled"
                checked={mergedAdminSettings?.enabled ?? true}
                onCheckedChange={(checked) => handleAdminChange('enabled', checked)}
              />
            </div>

            {/* Sound type */}
            <div className="space-y-2">
              <Label>Tipo de Som</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={mergedAdminSettings?.sound_type ?? 'bell'}
                  onValueChange={(value) => handleAdminChange('sound_type', value)}
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
                      (mergedAdminSettings?.sound_type as SoundType) ?? 'bell',
                      mergedAdminSettings?.volume ?? 0.7
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
                  {Math.round((mergedAdminSettings?.volume ?? 0.7) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[(mergedAdminSettings?.volume ?? 0.7) * 100]}
                  onValueChange={([value]) => handleAdminChange('volume', value / 100)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Anti-spam interval */}
            <div className="space-y-2">
              <Label htmlFor="admin-interval">Intervalo mínimo entre sons</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="admin-interval"
                  type="number"
                  min={1}
                  max={60}
                  value={mergedAdminSettings?.min_interval_seconds ?? 3}
                  onChange={(e) =>
                    handleAdminChange('min_interval_seconds', parseInt(e.target.value) || 3)
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">segundos</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Previne múltiplos sons em sequência rápida (anti-spam)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Panel Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Painel Cozinha
              </CardTitle>
              <CardDescription>
                Som para pedidos na cozinha com opção de repetição
              </CardDescription>
            </div>
            <SoundIndicator
              isPlaying={isPlayingKitchen}
              isEnabled={mergedKitchenSettings?.enabled ?? true}
              size="lg"
              showLabel
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="kitchen-enabled">Ativar som para cozinha</Label>
                <p className="text-sm text-muted-foreground">
                  Alertar a cozinha quando há pedidos pendentes
                </p>
              </div>
              <Switch
                id="kitchen-enabled"
                checked={mergedKitchenSettings?.enabled ?? true}
                onCheckedChange={(checked) => handleKitchenChange('enabled', checked)}
              />
            </div>

            {/* Sound type */}
            <div className="space-y-2">
              <Label>Tipo de Som</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={mergedKitchenSettings?.sound_type ?? 'kitchen-bell'}
                  onValueChange={(value) => handleKitchenChange('sound_type', value)}
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
                      (mergedKitchenSettings?.sound_type as SoundType) ?? 'kitchen-bell',
                      mergedKitchenSettings?.volume ?? 0.8
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
                  {Math.round((mergedKitchenSettings?.volume ?? 0.8) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[(mergedKitchenSettings?.volume ?? 0.8) * 100]}
                  onValueChange={([value]) => handleKitchenChange('volume', value / 100)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Anti-spam interval */}
            <div className="space-y-2">
              <Label htmlFor="kitchen-interval">Intervalo mínimo entre sons</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="kitchen-interval"
                  type="number"
                  min={1}
                  max={60}
                  value={mergedKitchenSettings?.min_interval_seconds ?? 3}
                  onChange={(e) =>
                    handleKitchenChange('min_interval_seconds', parseInt(e.target.value) || 3)
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">segundos</span>
              </div>
            </div>

            {/* Repeat settings */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="kitchen-repeat">Repetir som até interagir</Label>
                  <p className="text-sm text-muted-foreground">
                    Continua alertando até que alguém atenda o pedido
                  </p>
                </div>
                <Switch
                  id="kitchen-repeat"
                  checked={mergedKitchenSettings?.repeat_enabled ?? true}
                  onCheckedChange={(checked) => handleKitchenChange('repeat_enabled', checked)}
                />
              </div>

              {mergedKitchenSettings?.repeat_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="repeat-interval">Intervalo de repetição</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="repeat-interval"
                        type="number"
                        min={10}
                        max={120}
                        value={mergedKitchenSettings?.repeat_interval_seconds ?? 30}
                        onChange={(e) =>
                          handleKitchenChange(
                            'repeat_interval_seconds',
                            parseInt(e.target.value) || 30
                          )
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
                        value={Math.round(
                          (mergedKitchenSettings?.max_repeat_duration_seconds ?? 300) / 60
                        )}
                        onChange={(e) =>
                          handleKitchenChange(
                            'max_repeat_duration_seconds',
                            (parseInt(e.target.value) || 5) * 60
                          )
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
          </CardContent>
        </Card>

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
