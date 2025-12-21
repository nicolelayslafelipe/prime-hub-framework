import { cn } from '@/lib/utils';
import { useProducts } from '@/contexts/ProductContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PDVCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function PDVCategories({ selectedCategory, onSelectCategory }: PDVCategoriesProps) {
  const { categories } = useProducts();
  const activeCategories = categories.filter(c => c.isActive);

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Categorias
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all',
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary text-foreground'
            )}
          >
            <span className="text-xl">🍽️</span>
            <span className="font-medium text-sm truncate">Todos</span>
          </button>
          
          {activeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all',
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary text-foreground'
              )}
            >
              <span className="text-xl">{category.icon || '🍔'}</span>
              <span className="font-medium text-sm truncate">{category.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
