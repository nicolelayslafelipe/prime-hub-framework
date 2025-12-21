import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { useAdminUsers, InternalUser } from '@/hooks/useAdminUsers';
import { 
  Plus, 
  MoreVertical, 
  Shield, 
  ChefHat, 
  Bike, 
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type RoleFilter = 'all' | 'kitchen' | 'motoboy';

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-primary/20 text-primary' },
  kitchen: { label: 'Cozinha', icon: ChefHat, color: 'bg-orange-500/20 text-orange-500' },
  motoboy: { label: 'Motoboy', icon: Bike, color: 'bg-blue-500/20 text-blue-500' },
  client: { label: 'Cliente', icon: Shield, color: 'bg-muted text-muted-foreground' },
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'kitchen' | 'motoboy';
  isActive: boolean;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'kitchen',
  isActive: true,
};

export default function AdminUsers() {
  const { users, loading, error, fetchUsers, createUser, updateUser, toggleUserStatus, deleteUser } = useAdminUsers();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InternalUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = users.filter(user => {
    if (roleFilter === 'all') return true;
    return user.role === roleFilter;
  });

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      return;
    }

    setIsSubmitting(true);
    const result = await createUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
      role: formData.role,
      isActive: formData.isActive,
    });

    setIsSubmitting(false);
    if (result.success) {
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      return;
    }

    setIsSubmitting(true);
    const result = await updateUser(selectedUser.id, {
      email: formData.email !== selectedUser.email ? formData.email : undefined,
      name: formData.name,
      phone: formData.phone || null,
      isActive: formData.isActive,
    });

    setIsSubmitting(false);
    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setFormData(initialFormData);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    const result = await deleteUser(selectedUser.id);
    
    setIsSubmitting(false);
    if (result.success) {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleStatus = async (user: InternalUser) => {
    await toggleUserStatus(user.id, !user.isActive);
  };

  const openEditDialog = (user: InternalUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role as 'kitchen' | 'motoboy',
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: InternalUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Usuários" subtitle="Gestão de usuários e permissões">
        <LoadingState message="Carregando usuários..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Usuários" subtitle="Gestão de usuários e permissões">
        <ErrorState message={error} onRetry={fetchUsers} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Usuários" subtitle="Gestão de usuários e permissões">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button 
            variant={roleFilter === 'all' ? 'outline' : 'ghost'} 
            size="sm"
            onClick={() => setRoleFilter('all')}
          >
            Todos ({users.length})
          </Button>
          <Button 
            variant={roleFilter === 'kitchen' ? 'outline' : 'ghost'} 
            size="sm"
            onClick={() => setRoleFilter('kitchen')}
          >
            Cozinha ({users.filter(u => u.role === 'kitchen').length})
          </Button>
          <Button 
            variant={roleFilter === 'motoboy' ? 'outline' : 'ghost'} 
            size="sm"
            onClick={() => setRoleFilter('motoboy')}
          >
            Motoboys ({users.filter(u => u.role === 'motoboy').length})
          </Button>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="glass overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhum usuário encontrado.</p>
            <p className="text-sm mt-2">Clique em "Novo Usuário" para adicionar o primeiro.</p>
          </div>
        ) : (
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
                {filteredUsers.map((user) => {
                  const role = roleConfig[user.role];
                  const RoleIcon = role.icon;
                  return (
                    <tr key={user.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email || 'Sem email'}</p>
                            {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
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
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleStatus(user)}
                          />
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(user)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário para cozinha ou motoboy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'kitchen' | 'motoboy') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      Cozinha
                    </div>
                  </SelectItem>
                  <SelectItem value="motoboy">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4" />
                      Motoboy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Usuário ativo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Usuário ativo</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${selectedUser?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteUser}
        variant="destructive"
      />
    </AdminLayout>
  );
}
