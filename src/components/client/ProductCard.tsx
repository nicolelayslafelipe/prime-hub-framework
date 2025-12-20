import { Product } from '@/data/mockProducts';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}

const tagColors: Record<string, string> = {
  'NOVO': 'bg-accent/15 text-accent',
  'POPULAR': 'bg-primary/15 text-primary',
  'PROMOÇÃO': 'bg-destructive/15 text-destructive',
  'MAIS VENDIDO': 'bg-primary/15 text-primary',
};

export function ProductCard({ product, onOpenDetails }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div
      onClick={() => onOpenDetails?.(product)}
      className="card-premium-hover p-4 md:p-5 flex gap-4 cursor-pointer animate-fade-in"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1.5">
          <h3 className="font-semibold text-foreground leading-tight">
            {product.name}
          </h3>
          {product.tag && (
            <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tagColors[product.tag] || 'bg-secondary text-secondary-foreground'}`}>
              {product.tag}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground font-mono">
            R$ {product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through font-mono">
              R$ {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      
      <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-xl bg-muted flex items-center justify-center text-5xl md:text-6xl flex-shrink-0 overflow-hidden">
        <span className="transform hover:scale-110 transition-transform duration-300">
          {product.image}
        </span>
        <Button
          onClick={handleAddToCart}
          className="absolute -bottom-1 -right-1 h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-premium hover:bg-primary/90 transition-all hover:scale-105"
          size="icon"
        >
          <Plus className="h-5 w-5 text-primary-foreground" />
        </Button>
      </div>
    </div>
  );
}
