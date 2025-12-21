import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminClients } from '@/hooks/useAdminClients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Phone, ShoppingBag, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdminClient } from '@/hooks/useAdminClients';

export default function AdminClients() {
  const { clients, loading, toggleClientStatus, deleteClient } = useAdminClients();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [clientToDelete, setClientToDelete] = useState<AdminClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const handleDelete = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    await deleteClient(clientToDelete.id);
    setIsDeleting(false);
    setClientToDelete(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <AdminLayout title="Clientes" subtitle="Gerencie seus clientes">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Clientes" subtitle="Gerencie seus clientes">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <div 
              key={client.id} 
              className={cn(
                "card-premium p-4 transition-opacity",
                !client.is_active && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.phone || 'Sem telefone'}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  client.is_active 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-destructive/20 text-destructive'
                )}>
                  {client.is_active ? 'Ativo' : 'Bloqueado'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {client.total_orders} pedido{client.total_orders !== 1 ? 's' : ''}
                </span>
                <span className="font-medium text-accent">
                  R$ {client.total_spent.toFixed(2)}
                </span>
              </div>

              {client.last_order_date && (
                <p className="text-xs text-muted-foreground mb-3">
                  Último pedido: {format(new Date(client.last_order_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={client.is_active} 
                    onCheckedChange={() => toggleClientStatus(client.id, client.is_active)} 
                  />
                  <span className="text-xs text-muted-foreground">
                    {client.is_active ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedClient(client)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Ver
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setClientToDelete(client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Details Modal */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedClient.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedClient.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedClient.name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {selectedClient.phone || 'Sem telefone'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-xl font-bold">{selectedClient.total_orders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-xl font-bold text-accent">
                    R$ {selectedClient.total_spent.toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedClient.last_order_date && (
                <p className="text-sm text-muted-foreground">
                  Último pedido: {format(new Date(selectedClient.last_order_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}

              <p className="text-sm text-muted-foreground">
                Cliente desde: {format(new Date(selectedClient.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    selectedClient.is_active 
                      ? 'bg-accent/20 text-accent' 
                      : 'bg-destructive/20 text-destructive'
                  )}>
                    {selectedClient.is_active ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientToDelete(selectedClient);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        title="Excluir Cliente"
        description={
          clientToDelete?.total_orders && clientToDelete.total_orders > 0 ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                  Este cliente possui <strong>{clientToDelete.total_orders} pedido(s)</strong> no histórico. 
                  Por isso, ele será <strong>desativado</strong> em vez de excluído permanentemente.
                </p>
              </div>
              <p className="text-muted-foreground">
                O cliente não poderá mais fazer login, mas o histórico de pedidos será mantido.
              </p>
            </div>
          ) : (
            <p>
              Tem certeza que deseja excluir <strong>{clientToDelete?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
          )
        }
        confirmText={isDeleting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Excluindo...
          </span>
        ) : (
          clientToDelete?.total_orders && clientToDelete.total_orders > 0 ? 'Desativar' : 'Excluir'
        )}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
}
