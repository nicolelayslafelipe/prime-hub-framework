import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { mockClients } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react';
import { Client } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminClients() {
  const [clients, setClients] = useState(mockClients);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const toggleStatus = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'blocked' : 'active' } : c));
  };

  return (
    <AdminLayout title="Clientes" subtitle="Gerencie seus clientes">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map(client => (
          <div key={client.id} className={cn("card-premium p-4", client.status === 'blocked' && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
              <span className={cn("text-xs px-2 py-1 rounded-full", client.status === 'active' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive')}>
                {client.status === 'active' ? 'Ativo' : 'Bloqueado'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" />{client.totalOrders} pedidos</span>
              <span className="font-medium text-accent">R$ {client.totalSpent.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Switch checked={client.status === 'active'} onCheckedChange={() => toggleStatus(client.id)} />
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}><Eye className="h-4 w-4 mr-1" /> Ver</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Cliente</DialogTitle></DialogHeader>
          {selectedClient && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="font-semibold text-lg">{selectedClient.name}</p>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{selectedClient.phone}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{selectedClient.email}</div>
              </div>
              {selectedClient.addresses[0] && (
                <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-0.5" />
                  <span>{selectedClient.addresses[0].street}, {selectedClient.addresses[0].number} - {selectedClient.addresses[0].neighborhood}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                <div><p className="text-sm text-muted-foreground">Total Pedidos</p><p className="text-xl font-bold">{selectedClient.totalOrders}</p></div>
                <div><p className="text-sm text-muted-foreground">Total Gasto</p><p className="text-xl font-bold text-accent">R$ {selectedClient.totalSpent.toFixed(2)}</p></div>
              </div>
              {selectedClient.lastOrderDate && <p className="text-sm text-muted-foreground">Último pedido: {format(new Date(selectedClient.lastOrderDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
