import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="gradient-primary rounded-lg p-1.5 gradient-glow">
        <Package className={cn('text-primary-foreground', sizeClasses[size])} />
      </div>
      {showText && (
        <span className={cn('font-bold text-gradient', textSizes[size])}>
          DeliveryOS
        </span>
      )}
    </div>
  );
}
