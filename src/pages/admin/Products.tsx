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
import { ImageUpload } from '@/components/admin/ImageUpload';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Product } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

// Check if image is a real URL or just an emoji
const isRealImage = (image: string): boolean => {
  return image.startsWith('http') || image.startsWith('/') || image.startsWith('data:');
};

export default function AdminProducts() {
  const { 
    products, 
    categories, 
    isLoading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProduct,
    refetch 
  } = useProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    categoryId: '', 
    image: '', 
    tag: '',
    isAvailable: true,
  });

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.categoryId === filter);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId) return;
    
    setIsSaving(true);
    try {
      const data = { 
        name: form.name, 
        description: form.description, 
        price: parseFloat(form.price) || 0, 
        categoryId: form.categoryId, 
        image: form.image || '🍔', 
        tag: form.tag as Product['tag'], 
        isAvailable: form.isAvailable, 
        preparationTime: 15 
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ 
      name: product.name, 
      description: product.description, 
      price: product.price.toString(), 
      categoryId: product.categoryId, 
      image: product.image, 
      tag: product.tag || '',
      isAvailable: product.isAvailable,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', categoryId: '', image: '', tag: '', isAvailable: true });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout title="Produtos" subtitle="Gerencie os produtos do cardápio">
        <LoadingState message="Carregando produtos..." size="lg" />
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout title="Produtos" subtitle="Gerencie os produtos do cardápio">
        <ErrorState 
          title="Erro ao carregar produtos"
          message={error}
          onRetry={refetch}
        />
      </AdminLayout>
    );
  }

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

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Adicionar primeiro produto
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => {
            const hasRealImage = isRealImage(product.image);
            
            return (
              <div key={product.id} className={cn("card-premium p-4 transition-all", !product.isAvailable && "opacity-60")}>
                <div className="flex items-start gap-3 mb-3">
                  {/* Product Image Preview */}
                  {hasRealImage ? (
                    <div className="h-14 w-14 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                      {product.image}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {categories.find(c => c.id === product.categoryId)?.name}
                    </p>
                  </div>
                  {product.tag && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary flex-shrink-0">
                      {product.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-accent">R$ {product.price.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={product.isAvailable} onCheckedChange={() => toggleProduct(product.id)} />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Product Image Upload */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Foto do Produto</label>
              <ImageUpload 
                value={isRealImage(form.image) ? form.image : undefined}
                onChange={(url) => setForm(f => ({ ...f, image: url }))}
                onRemove={() => setForm(f => ({ ...f, image: '' }))}
                aspectRatio="square"
                bucket="products"
                path={`product-${editingProduct?.id || 'new'}`}
                placeholder="Adicione uma foto do produto"
              />
              {!isRealImage(form.image) && form.image && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Emoji atual: {form.image}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Nome do produto <span className="text-destructive">*</span>
              </label>
              <Input 
                placeholder="Ex: X-Burger Especial" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={cn(!form.name && "border-destructive/50")}
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
              <Textarea 
                placeholder="Descrição completa do produto" 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                rows={3} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Preço <span className="text-destructive">*</span>
                </label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.price} 
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className={cn(!form.price && "border-destructive/50")}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Categoria <span className="text-destructive">*</span>
                </label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className={cn(!form.categoryId && "border-destructive/50")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tag (opcional)</label>
              <Select value={form.tag} onValueChange={v => setForm(f => ({ ...f, tag: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione uma tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem tag</SelectItem>
                  <SelectItem value="NOVO">NOVO</SelectItem>
                  <SelectItem value="POPULAR">POPULAR</SelectItem>
                  <SelectItem value="PROMOÇÃO">PROMOÇÃO</SelectItem>
                  <SelectItem value="MAIS VENDIDO">MAIS VENDIDO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <label className="text-sm font-medium">Produto ativo</label>
                <p className="text-xs text-muted-foreground">
                  {form.isAvailable ? 'Visível no cardápio' : 'Oculto do cardápio'}
                </p>
              </div>
              <Switch 
                checked={form.isAvailable} 
                onCheckedChange={(checked) => setForm(f => ({ ...f, isAvailable: checked }))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!form.name || !form.price || !form.categoryId || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)} 
        title="Excluir Produto" 
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita." 
        confirmLabel="Excluir" 
        variant="destructive" 
        onConfirm={handleDelete} 
      />
    </AdminLayout>
  );
}
