import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductPlaceholderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProductPlaceholder({ size = 'md', className }: ProductPlaceholderProps) {
  const sizes = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20 md:h-24 md:w-24',
    lg: 'h-28 w-28 md:h-32 md:w-32',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-xl bg-muted/50 border border-border/50',
        sizes[size],
        className
      )}
    >
      <Package className={cn('text-muted-foreground/40', iconSizes[size])} />
    </div>
  );
}
