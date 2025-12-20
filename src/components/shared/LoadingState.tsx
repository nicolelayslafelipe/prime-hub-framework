import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ 
  message = 'Carregando...', 
  className,
  size = 'md' 
}: LoadingStateProps) {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerSizes = {
    sm: 'h-24',
    md: 'h-48',
    lg: 'h-64',
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      containerSizes[size],
      className
    )}>
      <Loader2 className={cn('animate-spin text-primary', iconSizes[size])} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
