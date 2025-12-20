import { Product } from '@/data/mockProducts';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { ProductPlaceholder } from '@/components/shared/ProductPlaceholder';
import { cn } from '@/lib/utils';

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

// Check if image is a real URL or just an emoji
const isRealImage = (image: string): boolean => {
  return image.startsWith('http') || image.startsWith('/') || image.startsWith('data:');
};

export function ProductCard({ product, onOpenDetails }: ProductCardProps) {
  const { addItem } = useCart();
  const hasRealImage = isRealImage(product.image);

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
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1.5">
          <h3 className="font-semibold text-foreground leading-tight">
            {product.name}
          </h3>
          {product.tag && (
            <span className={cn(
              'flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
              tagColors[product.tag] || 'bg-secondary text-secondary-foreground'
            )}>
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
      
      {/* Product Image - Controlled Size */}
      <div className="relative flex-shrink-0">
        {hasRealImage ? (
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden border border-border/50 bg-muted/30">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl bg-muted flex items-center justify-center text-4xl md:text-5xl overflow-hidden border border-border/30">
            <span className="transform transition-transform duration-300 hover:scale-110">
              {product.image}
            </span>
          </div>
        )}
        
        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          className="absolute -bottom-1 -right-1 h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          size="icon"
        >
          <Plus className="h-5 w-5 text-primary-foreground" />
        </Button>
      </div>
    </div>
  );
}
