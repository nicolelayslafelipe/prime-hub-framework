import { Category } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  productCounts: Record<string, number>;
}

export function CategoryNav({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  productCounts 
}: CategoryNavProps) {
  return (
    <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <button
            onClick={() => onCategoryChange('all')}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-glow-gold'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            <span>Todos</span>
          </button>
          
          {categories.filter(c => c.isActive).map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-glow-gold'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <span className="text-base">{category.icon}</span>
              <span>{category.name}</span>
              {productCounts[category.id] > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md",
                  activeCategory === category.id
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted'
                )}>
                  {productCounts[category.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
