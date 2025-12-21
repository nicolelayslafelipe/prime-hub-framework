import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Pencil, Save } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminPickup() {
  const { products, categories, refetch } = useProducts();
  const [pickupMessage, setPickupMessage] = useState("Retire seu pedido no balcão após confirmação");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const togglePickup = async (productId: string, currentValue: boolean) => {
    setUpdatingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ allow_pickup: !currentValue })
        .eq('id', productId);
      
      if (error) throw error;
      
      // Refetch to update local state
      await refetch();
      toast.success(!currentValue ? 'Produto disponível para retirada' : 'Produto indisponível para retirada');
    } catch (error) {
      console.error('Error updating pickup status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const isImageUrl = (image: string) => {
    return image?.startsWith('http') || image?.startsWith('data:');
  };

  return (
    <AdminLayout title="Itens para Retirada" subtitle="Configure quais produtos estão disponíveis para retirada">
      <div className="card-premium p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Mensagem para Retirada</p>
            <p className="text-sm text-muted-foreground">Exibida quando cliente escolhe retirar</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </div>
        <Input 
          placeholder="Ex: Retire seu pedido em até 30 minutos no balcão" 
          value={pickupMessage}
          onChange={(e) => setPickupMessage(e.target.value)}
          className="bg-background/50"
        />
      </div>

      <div className="space-y-8">
        {categories.filter(c => c.isActive).map(category => {
          const categoryProducts = products.filter(p => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                {category.name}
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2">
                  {categoryProducts.length} produtos
                </span>
              </h3>
              <div className="grid gap-3">
                {categoryProducts.map(product => {
                  const allowPickup = (product as any).allowPickup !== false;
                  const isUpdating = updatingId === product.id;
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`card-premium p-4 flex items-center gap-4 transition-all duration-200 ${
                        !allowPickup ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative flex-shrink-0">
                        {isImageUrl(product.image) ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-16 h-16 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">
                            {product.image || '🍔'}
                          </div>
                        )}
                        {!allowPickup && (
                          <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">Indisponível</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{product.name}</p>
                          {product.tag && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {product.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {product.description}
                        </p>
                        <p className="text-primary font-bold mt-1">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-medium ${allowPickup ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {allowPickup ? 'Disponível para retirada' : 'Indisponível para retirada'}
                          </span>
                          <Switch 
                            checked={allowPickup}
                            onCheckedChange={() => togglePickup(product.id, allowPickup)}
                            disabled={isUpdating}
                          />
                        </div>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-10 w-10"
                          onClick={() => window.location.href = '/admin/products'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum produto cadastrado</p>
            <p className="text-sm">Adicione produtos para configurar a retirada</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
