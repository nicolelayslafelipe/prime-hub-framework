import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfig } from '@/contexts/ConfigContext';
import { 
  Store, 
  Palette, 
  Bell, 
  Puzzle, 
  Clock,
  Save,
  Upload
} from 'lucide-react';

export default function AdminSettings() {
  const { config, updateEstablishment, updateNotifications, updateModules } = useConfig();

  return (
    <AdminLayout title="Configurações" subtitle="Personalize seu estabelecimento">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="glass p-1">
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="h-4 w-4" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Puzzle className="h-4 w-4" />
            Módulos
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6 glass">
            <h3 className="text-lg font-semibold mb-4">Informações do Estabelecimento</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Estabelecimento</Label>
                <Input
                  id="name"
                  value={config.establishment.name}
                  onChange={(e) => updateEstablishment({ name: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={config.establishment.phone}
                  onChange={(e) => updateEstablishment({ phone: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={config.establishment.address}
                  onChange={(e) => updateEstablishment({ address: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass">
            <h3 className="text-lg font-semibold mb-4">Configurações de Delivery</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minOrder">Pedido Mínimo (R$)</Label>
                <Input
                  id="minOrder"
                  type="number"
                  value={config.establishment.minOrderValue}
                  onChange={(e) => updateEstablishment({ minOrderValue: Number(e.target.value) })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  value={config.establishment.deliveryFee}
                  onChange={(e) => updateEstablishment({ deliveryFee: Number(e.target.value) })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Tempo Estimado (min)</Label>
                <Input
                  id="deliveryTime"
                  type="number"
                  value={config.establishment.estimatedDeliveryTime}
                  onChange={(e) => updateEstablishment({ estimatedDeliveryTime: Number(e.target.value) })}
                  className="bg-secondary/50"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Horário de Funcionamento</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Clock className="h-4 w-4" />
                Configurar Horários
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure os horários de abertura e fechamento para cada dia da semana.
            </p>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme" className="space-y-6">
          <Card className="p-6 glass">
            <h3 className="text-lg font-semibold mb-4">Identidade Visual</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo do Estabelecimento</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Arraste uma imagem ou clique para enviar
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Escolher Arquivo
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.theme.primaryColor}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.theme.primaryColor}
                      className="bg-secondary/50 flex-1"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={config.theme.accentColor}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.theme.accentColor}
                      className="bg-secondary/50 flex-1"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 glass">
            <h3 className="text-lg font-semibold mb-4">Sons e Alertas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium">Som de Novo Pedido</p>
                  <p className="text-sm text-muted-foreground">Tocar som quando um novo pedido chegar</p>
                </div>
                <Switch
                  checked={config.notifications.newOrderSound}
                  onCheckedChange={(checked) => updateNotifications({ newOrderSound: checked })}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium">Som de Mudança de Status</p>
                  <p className="text-sm text-muted-foreground">Tocar som quando o status de um pedido mudar</p>
                </div>
                <Switch
                  checked={config.notifications.orderStatusSound}
                  onCheckedChange={(checked) => updateNotifications({ orderStatusSound: checked })}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-muted-foreground">Receber emails sobre novos pedidos</p>
                </div>
                <Switch
                  checked={config.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateNotifications({ emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Notificações via WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Receber mensagens no WhatsApp</p>
                </div>
                <Switch
                  checked={config.notifications.whatsappNotifications}
                  onCheckedChange={(checked) => updateNotifications({ whatsappNotifications: checked })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Modules Settings */}
        <TabsContent value="modules" className="space-y-6">
          <Card className="p-6 glass">
            <h3 className="text-lg font-semibold mb-2">Módulos do Sistema</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Ative ou desative funcionalidades do seu sistema conforme sua necessidade.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { key: 'payments', title: 'Pagamentos Online', description: 'Aceite pagamentos via cartão e PIX', soon: true },
                { key: 'loyalty', title: 'Programa de Fidelidade', description: 'Sistema de pontos e recompensas', soon: true },
                { key: 'promotions', title: 'Promoções', description: 'Cupons de desconto e ofertas', soon: true },
                { key: 'reviews', title: 'Avaliações', description: 'Sistema de avaliação de pedidos', soon: true },
                { key: 'scheduling', title: 'Agendamento', description: 'Permitir agendamento de pedidos', soon: true },
                { key: 'multipleAddresses', title: 'Múltiplos Endereços', description: 'Cliente pode salvar vários endereços', soon: true },
              ].map((module) => (
                <Card key={module.key} className="p-4 bg-secondary/30 border-border/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{module.title}</p>
                        {module.soon && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            Em breve
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                    </div>
                    <Switch
                      checked={config.modules[module.key as keyof typeof config.modules]}
                      onCheckedChange={(checked) =>
                        updateModules({ [module.key]: checked })
                      }
                      disabled={module.soon}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="gap-2 shadow-lg">
          <Save className="h-5 w-5" />
          Salvar Alterações
        </Button>
      </div>
    </AdminLayout>
  );
}
