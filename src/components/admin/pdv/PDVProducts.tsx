import { useMemo, useState } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { usePDV } from '@/contexts/PDVContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PDVProductsProps {
  selectedCategory: string | null;
}

export function PDVProducts({ selectedCategory }: PDVProductsProps) {
  const { products } = useProducts();
  const { addItem } = usePDV();
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.isAvailable);
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [products, selectedCategory, search]);

  const handleAddItem = (product: typeof products[0]) => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      image: product.image || undefined,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddItem(product)}
                className={cn(
                  'relative flex flex-col items-center p-3 rounded-xl border-2 border-border',
                  'bg-card hover:bg-secondary/50 hover:border-primary/50',
                  'transition-all duration-200 text-left group'
                )}
              >
                {/* Image or Emoji */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex items-center justify-center mb-2">
                  {product.image?.startsWith('http') || product.image?.startsWith('/') ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{product.image || '🍔'}</span>
                  )}
                </div>

                {/* Name */}
                <h4 className="text-sm font-medium text-center line-clamp-2 mb-1 min-h-[40px]">
                  {product.name}
                </h4>

                {/* Price */}
                <span className="text-sm font-bold text-primary">
                  {formatPrice(product.price)}
                </span>

                {/* Add indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>

                {/* Tag */}
                {product.tag && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-semibold bg-accent text-accent-foreground rounded">
                    {product.tag}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
