import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  iconColor?: string;
}

export function StatsCard({ title, value, change, icon, iconColor }: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="p-6 glass glass-hover">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive && 'text-success',
                isNegative && 'text-destructive',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{isPositive ? '+' : ''}{change}% vs ontem</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-xl p-3',
            iconColor || 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
