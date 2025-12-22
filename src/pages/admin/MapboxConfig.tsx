import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Map, CheckCircle2, XCircle, Loader2, AlertTriangle, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapboxConfig {
  isActive: boolean;
  status: 'connected' | 'disconnected' | 'error';
  environment: 'production';
  lastUpdated?: string;
  credentialsVersion: number;
}

const defaultConfig: MapboxConfig = {
  isActive: false,
  status: 'disconnected',
  environment: 'production',
  credentialsVersion: 1
};

export default function MapboxConfigPage() {
  const { value: config, updateValue, isLoading, isSaving } = useAdminSettings<MapboxConfig>('mapbox_config', defaultConfig);
  const [localConfig, setLocalConfig] = useState<MapboxConfig>(defaultConfig);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    if (!newToken.startsWith('pk.')) {
      toast.error('Token público do Mapbox deve começar com "pk."');
      return;
    }

    setIsUpdatingToken(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-mapbox-token', {
        body: { accessToken: newToken }
      });

      if (error) throw error;

      if (data?.success) {
        const newConfig: MapboxConfig = {
          ...localConfig,
          isActive: true,
          status: 'connected',
          lastUpdated: new Date().toISOString(),
          credentialsVersion: (localConfig.credentialsVersion || 1) + 1
        };
        await updateValue(newConfig);
        setLocalConfig(newConfig);
        setNewToken('');
        setIsTokenDialogOpen(false);
        toast.success('Token do Mapbox atualizado com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro ao atualizar token');
      }
    } catch (error) {
      console.error('Error updating Mapbox token:', error);
      toast.error('Erro ao atualizar token do Mapbox');
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-mapbox-connection');

      if (error) throw error;

      if (data?.success) {
        const newConfig: MapboxConfig = {
          ...localConfig,
          isActive: true,
          status: 'connected'
        };
        await updateValue(newConfig);
        setLocalConfig(newConfig);
        toast.success('Conexão com Mapbox verificada!');
      } else {
        const newConfig: MapboxConfig = {
          ...localConfig,
          isActive: false,
          status: 'error'
        };
        await updateValue(newConfig);
        setLocalConfig(newConfig);
        toast.error(data?.error || 'Token inválido ou expirado');
      }
    } catch (error) {
      console.error('Error testing Mapbox connection:', error);
      const newConfig: MapboxConfig = {
        ...localConfig,
        isActive: false,
        status: 'error'
      };
      await updateValue(newConfig);
      setLocalConfig(newConfig);
      toast.error('Erro ao testar conexão com Mapbox');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Configurações do Mapbox">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = () => {
    switch (localConfig.status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Conectado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Não configurado
          </Badge>
        );
    }
  };

  return (
    <AdminLayout title="Configurações do Mapbox">
      <div className="space-y-6 max-w-3xl">
        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Map className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Mapbox</CardTitle>
                <CardDescription>Serviço de mapas e geolocalização</CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Status</Label>
                <p className="font-medium">
                  {localConfig.status === 'connected' ? 'Ativo' : 
                   localConfig.status === 'error' ? 'Inválido' : 'Pendente'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Versão</Label>
                <p className="font-medium">v{localConfig.credentialsVersion || 1}</p>
              </div>
              {localConfig.lastUpdated && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Última Atualização</Label>
                  <p className="font-medium">
                    {new Date(localConfig.lastUpdated).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    {localConfig.status === 'connected' ? 'Atualizar Token' : 'Configurar Token'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Token de Acesso do Mapbox</DialogTitle>
                    <DialogDescription>
                      Insira seu Public Access Token do Mapbox. Você pode encontrá-lo em{' '}
                      <a 
                        href="https://account.mapbox.com/access-tokens/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        account.mapbox.com
                      </a>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="mapbox-token">Public Access Token</Label>
                      <div className="relative">
                        <Input
                          id="mapbox-token"
                          type={showToken ? 'text' : 'password'}
                          placeholder="pk.eyJ1Ijoi..."
                          value={newToken}
                          onChange={(e) => setNewToken(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O token deve começar com "pk." (token público)
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTokenDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateToken} disabled={isUpdatingToken || !newToken.trim()}>
                      {isUpdatingToken && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Token
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                onClick={testConnection} 
                disabled={isTesting || localConfig.status === 'disconnected'}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Segurança</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• O token é armazenado de forma segura no servidor</p>
            <p>• Apenas administradores podem visualizar ou alterar as credenciais</p>
            <p>• O token nunca é exposto no frontend</p>
            <p>• Ao trocar o token, o anterior é invalidado imediatamente</p>
            <p>• Todas as alterações são registradas no log de auditoria</p>
          </CardContent>
        </Card>

        {/* Usage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Onde é utilizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>O Mapbox é usado nas seguintes áreas do sistema:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Seleção de endereço no checkout</li>
              <li>Mapa de acompanhamento do pedido</li>
              <li>Painel do motoboy com rotas</li>
              <li>Cálculo de taxa de entrega por distância</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
