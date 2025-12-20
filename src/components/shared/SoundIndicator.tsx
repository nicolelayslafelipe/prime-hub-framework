import { Bell, BellOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundIndicatorProps {
  isPlaying: boolean;
  isEnabled: boolean;
  isRepeating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SoundIndicator({
  isPlaying,
  isEnabled,
  isRepeating = false,
  size = 'md',
  showLabel = false,
  className,
}: SoundIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const containerSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  if (!isEnabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-muted-foreground',
          className
        )}
        title="Som desativado"
      >
        <div className={cn('rounded-full bg-muted', containerSizeClasses[size])}>
          <BellOff className={cn(sizeClasses[size], 'text-muted-foreground')} />
        </div>
        {showLabel && <span className="text-xs">Som desativado</span>}
      </div>
    );
  }

  if (isPlaying || isRepeating) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5',
          className
        )}
        title={isRepeating ? 'Som em repetição' : 'Tocando som'}
      >
        <div
          className={cn(
            'rounded-full bg-primary/20 relative',
            containerSizeClasses[size],
            'animate-pulse'
          )}
        >
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          <div
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
            style={{ animationDelay: '0.2s' }}
          />
          <Volume2 className={cn(sizeClasses[size], 'text-primary relative z-10')} />
        </div>
        {showLabel && (
          <span className="text-xs text-primary font-medium">
            {isRepeating ? 'Repetindo...' : 'Tocando'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      title="Som ativado"
    >
      <div
        className={cn(
          'rounded-full bg-muted/50',
          containerSizeClasses[size]
        )}
      >
        <Bell className={cn(sizeClasses[size])} />
      </div>
      {showLabel && <span className="text-xs">Som ativado</span>}
    </div>
  );
}
