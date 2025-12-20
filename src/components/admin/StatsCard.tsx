import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  accentColor?: 'gold' | 'emerald' | 'sapphire' | 'default';
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  accentColor = 'default'
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const accentClasses = {
    gold: 'border-l-primary',
    emerald: 'border-l-accent',
    sapphire: 'border-l-sapphire',
    default: 'border-l-border',
  };

  const iconBgClasses = {
    gold: 'bg-primary/10 text-primary',
    emerald: 'bg-accent/10 text-accent',
    sapphire: 'bg-sapphire/10 text-sapphire',
    default: 'bg-muted text-muted-foreground',
  };

  return (
    <div 
      className={cn(
        'card-premium p-5 border-l-2 transition-all duration-300 hover:shadow-premium-lg',
        accentClasses[accentColor]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight font-mono">{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                isPositive && 'text-accent',
                isNegative && 'text-destructive',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>{isPositive ? '+' : ''}{change}% vs ontem</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-3',
            iconBgClasses[accentColor]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
