import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  iconColor?: string;
  accentColor?: 'primary' | 'accent' | 'success' | 'warning' | 'neon-blue' | 'neon-pink';
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  iconColor,
  accentColor = 'primary'
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const accentClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    accent: 'from-accent/20 to-accent/5 border-accent/20',
    success: 'from-success/20 to-success/5 border-success/20',
    warning: 'from-warning/20 to-warning/5 border-warning/20',
    'neon-blue': 'from-neon-blue/20 to-neon-blue/5 border-neon-blue/20',
    'neon-pink': 'from-neon-pink/20 to-neon-pink/5 border-neon-pink/20',
  };

  const iconColorClasses = {
    primary: 'bg-primary/20 text-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]',
    accent: 'bg-accent/20 text-accent shadow-[0_0_30px_-5px_hsl(var(--accent)/0.5)]',
    success: 'bg-success/20 text-success shadow-[0_0_30px_-5px_hsl(var(--success)/0.5)]',
    warning: 'bg-warning/20 text-warning shadow-[0_0_30px_-5px_hsl(var(--warning)/0.5)]',
    'neon-blue': 'bg-neon-blue/20 text-neon-blue shadow-[0_0_30px_-5px_hsl(var(--neon-blue)/0.5)]',
    'neon-pink': 'bg-neon-pink/20 text-neon-pink shadow-[0_0_30px_-5px_hsl(var(--neon-pink)/0.5)]',
  };

  return (
    <div 
      className={cn(
        'relative group p-6 rounded-2xl border bg-gradient-to-br overflow-hidden transition-all duration-300 hover:scale-[1.02]',
        accentClasses[accentColor],
        'hover:border-opacity-50'
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={cn(
          'absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20',
          accentColor === 'primary' && 'bg-primary',
          accentColor === 'accent' && 'bg-accent',
          accentColor === 'success' && 'bg-success',
          accentColor === 'warning' && 'bg-warning',
          accentColor === 'neon-blue' && 'bg-neon-blue',
          accentColor === 'neon-pink' && 'bg-neon-pink',
        )} />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-4xl font-black tracking-tight">{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm font-semibold',
                isPositive && 'text-success',
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
            'rounded-2xl p-4 transition-all duration-300',
            iconColor || iconColorClasses[accentColor]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
