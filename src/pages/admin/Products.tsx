import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ProductForm } from '@/components/admin/ProductForm';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ErrorBoundary, ModalErrorFallback } from '@/components/shared/ErrorBoundary';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

// Check if image is a real URL or just an emoji
const isRealImage = (image: string): boolean => {
  if (!image || typeof image !== 'string') return false;
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
  const [modalKey, setModalKey] = useState(0); // Key para forçar re-render do modal

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.categoryId === filter);

  const handleSubmit = async (formData: {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    image: string;
    tag: string;
    isAvailable: boolean;
  }) => {
    if (!formData.name || !formData.price || !formData.categoryId) return;
    
    setIsSaving(true);
    try {
      const data = { 
        name: formData.name, 
        description: formData.description, 
        price: parseFloat(formData.price) || 0, 
        categoryId: formData.categoryId, 
        image: formData.image || '🍔', 
        tag: formData.tag as Product['tag'], 
        isAvailable: formData.isAvailable, 
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

  const handleEdit = useCallback((product: Product) => {
    try {
      // Incrementa key para forçar re-render limpo do modal
      setModalKey(prev => prev + 1);
      setEditingProduct(product);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error preparing edit:', err);
    }
  }, []);

  const handleOpenNewProduct = useCallback(() => {
    setModalKey(prev => prev + 1);
    setEditingProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Limpa o produto após fechar para evitar flash de dados antigos
    setTimeout(() => {
      setEditingProduct(null);
    }, 150);
  }, []);

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
        <Button onClick={handleOpenNewProduct} className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          <Button onClick={handleOpenNewProduct} variant="outline" className="mt-4 gap-2">
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
                        onError={(e) => {
                          // Fallback para placeholder se imagem falhar
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="h-full w-full bg-muted flex items-center justify-center text-lg">🍔</div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                      {product.image || '🍔'}
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

      {/* Modal com Error Boundary */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <ErrorBoundary 
            fallback={<ModalErrorFallback onClose={handleCloseModal} />}
            onReset={handleCloseModal}
          >
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <ProductForm
                key={modalKey}
                product={editingProduct}
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
                isSaving={isSaving}
              />
            </div>
          </ErrorBoundary>
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
