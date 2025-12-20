import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfig } from '@/contexts/ConfigContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { config } = useConfig();
  const logoUrl = config.establishment.logo;

  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {logoUrl ? (
        <div 
          className={cn(
            'relative flex items-center justify-center rounded-xl overflow-hidden border border-border/30 bg-background',
            sizes[size]
          )}
        >
          <img 
            src={logoUrl} 
            alt={config.establishment.name || 'Logo'}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div 
          className={cn(
            'relative flex items-center justify-center rounded-xl gradient-primary glow-primary',
            sizes[size]
          )}
        >
          <Zap className="h-1/2 w-1/2 text-primary-foreground fill-primary-foreground" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      )}
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-black tracking-tight leading-none gradient-text', textSizes[size])}>
            {config.establishment.name || 'DeliveryOS'}
          </span>
          {size === 'lg' && (
            <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase mt-1">
              Premium Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}
