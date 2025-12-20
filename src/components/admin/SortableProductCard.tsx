import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Edit, Trash2, Copy } from 'lucide-react';
import { Product, Category } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

interface SortableProductCardProps {
  product: Product;
  categories: Category[];
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isDragging?: boolean;
}

const isRealImage = (image: string): boolean => {
  if (!image || typeof image !== 'string') return false;
  return image.startsWith('http') || image.startsWith('/') || image.startsWith('data:');
};

export function SortableProductCard({
  product,
  categories,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
}: SortableProductCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasRealImage = isRealImage(product.image);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-premium p-4 transition-all",
        !product.isAvailable && "opacity-60",
        isDragging && "opacity-50 shadow-2xl scale-105 z-50"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          title="Arraste para reordenar"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Product Image */}
        {hasRealImage ? (
          <div className="h-12 w-12 rounded-lg overflow-hidden border border-border/50 flex-shrink-0 bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'h-full w-full bg-muted flex items-center justify-center text-lg';
                  fallback.textContent = '🍔';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
            {product.image || '🍔'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {categories.find(c => c.id === product.categoryId)?.name}
          </p>
        </div>
        {product.tag && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary flex-shrink-0">
            {product.tag}
          </span>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-accent">R$ {product.price.toFixed(2)}</span>
        <div className="flex items-center gap-1">
          <Switch 
            checked={product.isAvailable} 
            onCheckedChange={() => onToggle(product.id)} 
          />
          <Button variant="ghost" size="icon" onClick={() => onDuplicate(product)} title="Duplicar produto">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(product)} title="Editar produto">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(product.id)} title="Excluir produto">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
