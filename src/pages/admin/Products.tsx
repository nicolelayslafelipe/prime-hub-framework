import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

export default function AdminProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct, toggleProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', image: '🍔', tag: '' });

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.categoryId === filter);

  const handleSubmit = () => {
    const data = { name: form.name, description: form.description, price: parseFloat(form.price) || 0, categoryId: form.categoryId, image: form.image, tag: form.tag as any, isAvailable: true, preparationTime: 15 };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    handleCloseModal();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description, price: product.price.toString(), categoryId: product.categoryId, image: product.image, tag: product.tag || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', categoryId: '', image: '🍔', tag: '' });
  };

  return (
    <AdminLayout title="Produtos" subtitle="Gerencie os produtos do cardápio">
      <div className="flex justify-between items-center mb-6 gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map(product => (
          <div key={product.id} className={cn("card-premium p-4 transition-all", !product.isAvailable && "opacity-60")}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{product.image}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground truncate">{categories.find(c => c.id === product.categoryId)?.name}</p>
              </div>
              {product.tag && <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{product.tag}</span>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-accent">R$ {product.price.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <Switch checked={product.isAvailable} onCheckedChange={() => toggleProduct(product.id)} />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(product.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <Input placeholder="🍔" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="w-16 text-center text-2xl" />
              <Input placeholder="Nome do produto" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="flex-1" />
            </div>
            <Textarea placeholder="Descrição completa" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="Preço" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Select value={form.tag} onValueChange={v => setForm(f => ({ ...f, tag: v }))}>
              <SelectTrigger><SelectValue placeholder="Tag (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NOVO">NOVO</SelectItem>
                <SelectItem value="POPULAR">POPULAR</SelectItem>
                <SelectItem value="PROMOÇÃO">PROMOÇÃO</SelectItem>
                <SelectItem value="MAIS VENDIDO">MAIS VENDIDO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={handleCloseModal}>Cancelar</Button><Button onClick={handleSubmit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Produto" description="Tem certeza que deseja excluir este produto?" confirmLabel="Excluir" variant="destructive" onConfirm={() => { deleteProduct(deleteId!); setDeleteId(null); }} />
    </AdminLayout>
  );
}
