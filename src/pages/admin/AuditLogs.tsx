import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditLogs, type AuditLogEntry } from '@/hooks/useAuditLogs';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  RefreshCw,
  Eye,
  Shield,
  User,
  Package,
  Tag,
  Ticket,
  ShoppingBag,
  Settings,
  CreditCard,
  MapPin,
  Clock,
  Key,
  Lock,
  Search,
  ChevronDown,
} from 'lucide-react';

const actionLabels: Record<string, { label: string; color: string }> = {
  create_user: { label: 'Criar Usuário', color: 'bg-emerald-500' },
  update_user: { label: 'Atualizar Usuário', color: 'bg-blue-500' },
  delete_user: { label: 'Excluir Usuário', color: 'bg-red-500' },
  soft_delete_user: { label: 'Desativar Usuário', color: 'bg-orange-500' },
  hard_delete_user: { label: 'Excluir Permanente', color: 'bg-red-600' },
  toggle_user_status: { label: 'Alterar Status', color: 'bg-yellow-500' },
  create_user_failed: { label: 'Falha ao Criar', color: 'bg-red-400' },
  delete_user_failed: { label: 'Falha ao Excluir', color: 'bg-red-400' },
  update_role: { label: 'Alterar Permissão', color: 'bg-purple-500' },
  create_product: { label: 'Criar Produto', color: 'bg-emerald-500' },
  update_product: { label: 'Atualizar Produto', color: 'bg-blue-500' },
  delete_product: { label: 'Excluir Produto', color: 'bg-red-500' },
  toggle_product: { label: 'Alterar Produto', color: 'bg-yellow-500' },
  create_category: { label: 'Criar Categoria', color: 'bg-emerald-500' },
  update_category: { label: 'Atualizar Categoria', color: 'bg-blue-500' },
  delete_category: { label: 'Excluir Categoria', color: 'bg-red-500' },
  create_coupon: { label: 'Criar Cupom', color: 'bg-emerald-500' },
  update_coupon: { label: 'Atualizar Cupom', color: 'bg-blue-500' },
  delete_coupon: { label: 'Excluir Cupom', color: 'bg-red-500' },
  toggle_coupon: { label: 'Alterar Cupom', color: 'bg-yellow-500' },
  update_order_status: { label: 'Atualizar Pedido', color: 'bg-blue-500' },
  delete_order: { label: 'Excluir Pedido', color: 'bg-red-500' },
  assign_motoboy: { label: 'Atribuir Motoboy', color: 'bg-purple-500' },
  update_settings: { label: 'Alterar Configurações', color: 'bg-blue-500' },
  update_credentials: { label: 'Alterar Credenciais', color: 'bg-orange-500' },
  login_success: { label: 'Login Sucesso', color: 'bg-emerald-500' },
  login_failed: { label: 'Login Falhou', color: 'bg-red-500' },
  logout: { label: 'Logout', color: 'bg-gray-500' },
};

const resourceIcons: Record<string, React.ReactNode> = {
  users: <User className="h-4 w-4" />,
  products: <Package className="h-4 w-4" />,
  categories: <Tag className="h-4 w-4" />,
  coupons: <Ticket className="h-4 w-4" />,
  orders: <ShoppingBag className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  payment_methods: <CreditCard className="h-4 w-4" />,
  delivery_zones: <MapPin className="h-4 w-4" />,
  business_hours: <Clock className="h-4 w-4" />,
  credentials: <Key className="h-4 w-4" />,
  auth: <Lock className="h-4 w-4" />,
};

const resourceLabels: Record<string, string> = {
  users: 'Usuários',
  products: 'Produtos',
  categories: 'Categorias',
  coupons: 'Cupons',
  orders: 'Pedidos',
  settings: 'Configurações',
  payment_methods: 'Métodos de Pagamento',
  delivery_zones: 'Zonas de Entrega',
  business_hours: 'Horários',
  credentials: 'Credenciais',
  auth: 'Autenticação',
};

export default function AuditLogs() {
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { logs, loading, error, hasMore, loadMore, refresh } = useAuditLogs({
    limit: 50,
    resource: selectedResource || undefined,
  });

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query) ||
      log.user_name?.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  });

  const getActionBadge = (action: string) => {
    const config = actionLabels[action] || { label: action, color: 'bg-gray-500' };
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getResourceIcon = (resource: string) => {
    return resourceIcons[resource] || <Shield className="h-4 w-4" />;
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return '-';
    
    // Show summary of important fields
    const summary: string[] = [];
    
    if (details.target_name) summary.push(`Alvo: ${details.target_name}`);
    if (details.target_email) summary.push(`Email: ${details.target_email}`);
    if (details.target_role) summary.push(`Função: ${details.target_role}`);
    if (details.new_status !== undefined) summary.push(`Status: ${details.new_status ? 'Ativo' : 'Inativo'}`);
    if (details.order_number) summary.push(`Pedido: #${details.order_number}`);
    if (details.error) summary.push(`Erro: ${String(details.error).substring(0, 50)}`);
    
    return summary.length > 0 ? summary.join(' | ') : 'Ver detalhes';
  };

  if (error) {
    return (
      <AdminLayout title="Logs de Auditoria" subtitle="Histórico de ações do sistema">
        <ErrorState 
          title="Erro ao carregar logs"
          message={error.message}
          onRetry={refresh}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Logs de Auditoria" subtitle="Histórico de ações sensíveis do sistema">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4 glass">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ação, recurso ou usuário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger className="w-full md:w-[200px] bg-secondary/50">
                <SelectValue placeholder="Todos os recursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os recursos</SelectItem>
                {Object.entries(resourceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {resourceIcons[key]}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 glass">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 glass">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ações de Usuário</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.resource === 'users').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 glass">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Key className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credenciais</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.resource === 'credentials').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 glass">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Lock className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action.includes('failed')).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="glass overflow-hidden">
          {loading && logs.length === 0 ? (
            <LoadingState message="Carregando logs..." />
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className="border-border/30 hover:bg-secondary/30"
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{log.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResourceIcon(log.resource)}
                            <span>{resourceLabels[log.resource] || log.resource}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                          {formatDetails(log.details)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {hasMore && (
                <div className="p-4 border-t border-border/50 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="gap-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Carregar mais
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Detalhes do Log
              </DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data/Hora</p>
                    <p className="font-mono">
                      {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Usuário</p>
                    <p className="font-medium">{selectedLog.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Recurso</p>
                    <div className="flex items-center gap-2">
                      {getResourceIcon(selectedLog.resource)}
                      <span>{resourceLabels[selectedLog.resource] || selectedLog.resource}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ação</p>
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Detalhes Completos</p>
                  <pre className="bg-secondary/50 p-4 rounded-lg overflow-auto max-h-[300px] text-sm font-mono">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID do Log</p>
                    <p className="font-mono text-xs">{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID do Usuário</p>
                    <p className="font-mono text-xs">{selectedLog.user_id}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
