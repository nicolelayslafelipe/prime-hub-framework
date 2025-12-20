import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ProductForm } from '@/components/admin/ProductForm';
import { SortableProductCard } from '@/components/admin/SortableProductCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Plus, ArrowUpDown } from 'lucide-react';
import { Product } from '@/data/mockProducts';
import { toast } from 'sonner';

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
    reorderProducts,
    refetch 
  } = useProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredProducts = useMemo(() => {
    return filter === 'all' ? products : products.filter(p => p.categoryId === filter);
  }, [filter, products]);

  const productIds = useMemo(() => filteredProducts.map(p => p.id), [filteredProducts]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredProducts.findIndex(p => p.id === active.id);
      const newIndex = filteredProducts.findIndex(p => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Se estiver filtrando por categoria, reordena apenas os produtos filtrados
        if (filter !== 'all') {
          const reordered = arrayMove(filteredProducts, oldIndex, newIndex);
          // Reconstruir array completo mantendo ordem dos outros
          const otherProducts = products.filter(p => p.categoryId !== filter);
          const newOrder = [...otherProducts, ...reordered];
          await reorderProducts(newOrder);
        } else {
          const newOrder = arrayMove(products, oldIndex, newIndex);
          await reorderProducts(newOrder);
        }
        toast.success('Ordem atualizada');
      }
    }
  }, [filteredProducts, filter, products, reorderProducts]);

  const handleSubmit = useCallback(async (formData: {
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
        tag: (formData.tag === 'none' ? '' : formData.tag) as Product['tag'], 
        isAvailable: formData.isAvailable, 
        preparationTime: 15 
      };
      
      if (editingProduct?.id) {
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
  }, [editingProduct, updateProduct, addProduct]);

  const handleEdit = useCallback((product: Product) => {
    setModalKey(prev => prev + 1);
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleDuplicate = useCallback((product: Product) => {
    const duplicatedProduct = {
      ...product,
      id: '',
      name: `${product.name} (Cópia)`,
    } as Product;
    
    setModalKey(prev => prev + 1);
    setEditingProduct(duplicatedProduct);
    setIsModalOpen(true);
    toast.info('Editando cópia do produto');
  }, []);

  const handleOpenNewProduct = useCallback(() => {
    setModalKey(prev => prev + 1);
    setEditingProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingProduct(null);
    }, 200);
  }, []);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Produtos" subtitle="Gerencie os produtos do cardápio">
        <LoadingState message="Carregando produtos..." size="lg" />
      </AdminLayout>
    );
  }

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
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button 
            variant={isReorderMode ? "default" : "outline"} 
            onClick={() => setIsReorderMode(!isReorderMode)}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {isReorderMode ? 'Modo Ordenação' : 'Reordenar'}
          </Button>
        </div>
        <Button onClick={handleOpenNewProduct} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {isReorderMode && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
          <ArrowUpDown className="h-4 w-4 inline mr-2" />
          Arraste os produtos para reordenar. A ordem será salva automaticamente.
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          <Button onClick={handleOpenNewProduct} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Adicionar primeiro produto
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={productIds} strategy={rectSortingStrategy}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map(product => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  categories={categories}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteId}
                  onToggle={toggleProduct}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.id ? 'Editar Produto' : editingProduct ? 'Duplicar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct?.id 
                ? 'Atualize as informações do produto' 
                : editingProduct 
                  ? 'Ajuste os dados e salve como novo produto'
                  : 'Adicione um novo produto ao cardápio'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ProductForm
              key={modalKey}
              product={editingProduct}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSaving={isSaving}
            />
          </div>
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
