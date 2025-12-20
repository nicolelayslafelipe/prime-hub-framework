import { AdminLayout } from '@/components/admin/AdminLayout';
import { useProducts } from '@/contexts/ProductContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ShoppingCart } from 'lucide-react';

export default function AdminPickup() {
  const { products, categories } = useProducts();

  return (
    <AdminLayout title="Itens para Retirada" subtitle="Configure quais produtos estão disponíveis para retirada">
      <div className="card-premium p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold">Mensagem para Retirada</p>
            <p className="text-sm text-muted-foreground">Exibida quando cliente escolhe retirar</p>
          </div>
        </div>
        <Input placeholder="Ex: Retire seu pedido em até 30 minutos no balcão" defaultValue="Retire seu pedido no balcão após confirmação" />
      </div>

      <div className="space-y-6">
        {categories.filter(c => c.isActive).map(category => {
          const categoryProducts = products.filter(p => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category.icon} {category.name}</h3>
              <div className="space-y-2">
                {categoryProducts.map(product => (
                  <div key={product.id} className="card-premium p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{product.image}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">R$ {product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{(product as any).allowPickup !== false ? 'Disponível' : 'Indisponível'}</span>
                      <Switch checked={product.isAvailable} disabled />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
