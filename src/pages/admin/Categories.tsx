import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Category } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategory, reorderCategories } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🍔', description: '' });

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategory(editingCategory.id, form);
    } else {
      addCategory({ ...form, isActive: true });
    }
    handleCloseModal();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, icon: category.icon, description: category.description });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setForm({ name: '', icon: '🍔', description: '' });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout title="Categorias" subtitle="Gerencie as categorias do cardápio">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="space-y-3">
        {categories.map((category, index) => (
          <div key={category.id} className={cn(
            "card-premium p-4 flex items-center gap-4 transition-all",
            !category.isActive && "opacity-60"
          )}>
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <span className="text-2xl">{category.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{category.name}</p>
              <p className="text-sm text-muted-foreground truncate">{category.description}</p>
            </div>
            <Switch checked={category.isActive} onCheckedChange={() => toggleCategory(category.id)} />
            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(category.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <Input placeholder="Ícone (emoji)" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-20 text-center text-2xl" />
              <Input placeholder="Nome da categoria" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="flex-1" />
            </div>
            <Input placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Categoria" description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita." confirmLabel="Excluir" variant="destructive" onConfirm={handleDelete} />
    </AdminLayout>
  );
}
