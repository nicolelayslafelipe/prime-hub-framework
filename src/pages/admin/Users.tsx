import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreVertical, 
  Shield, 
  ChefHat, 
  Bike, 
  User 
} from 'lucide-react';

const mockUsers = [
  { id: '1', name: 'Admin Principal', email: 'admin@deliveryos.com', role: 'admin', isActive: true },
  { id: '2', name: 'João Cozinha', email: 'joao@deliveryos.com', role: 'kitchen', isActive: true },
  { id: '3', name: 'Maria Cozinha', email: 'maria@deliveryos.com', role: 'kitchen', isActive: true },
  { id: '4', name: 'Carlos Entregador', email: 'carlos@deliveryos.com', role: 'motoboy', isActive: true },
  { id: '5', name: 'Pedro Entregador', email: 'pedro@deliveryos.com', role: 'motoboy', isActive: false },
];

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-primary/20 text-primary' },
  kitchen: { label: 'Cozinha', icon: ChefHat, color: 'bg-panel-kitchen/20 text-panel-kitchen' },
  motoboy: { label: 'Motoboy', icon: Bike, color: 'bg-panel-motoboy/20 text-panel-motoboy' },
  client: { label: 'Cliente', icon: User, color: 'bg-panel-client/20 text-panel-client' },
};

export default function AdminUsers() {
  return (
    <AdminLayout title="Usuários" subtitle="Gestão de usuários e permissões">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Todos</Button>
          <Button variant="ghost" size="sm">Admins</Button>
          <Button variant="ghost" size="sm">Cozinha</Button>
          <Button variant="ghost" size="sm">Motoboys</Button>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Usuário</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Função</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => {
                const role = roleConfig[user.role as keyof typeof roleConfig];
                const RoleIcon = role.icon;
                return (
                  <tr key={user.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-medium">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        {role.label}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
