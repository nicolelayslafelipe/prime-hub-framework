import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface StatusToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function StatusToggle({
  checked,
  onCheckedChange,
  label,
  description,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
  size = 'md',
  disabled = false,
}: StatusToggleProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors',
      checked ? 'bg-accent/5 border-accent/20' : 'bg-muted/30 border-border',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <div className="space-y-1">
        {label && (
          <p className={cn(
            'font-medium',
            size === 'sm' && 'text-sm',
            size === 'lg' && 'text-lg'
          )}>
            {label}
          </p>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium',
          checked ? 'text-accent' : 'text-muted-foreground'
        )}>
          <span className={cn(
            'h-2 w-2 rounded-full',
            checked ? 'bg-accent' : 'bg-muted-foreground/50'
          )} />
          {checked ? activeLabel : inactiveLabel}
        </span>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-accent"
      />
    </div>
  );
}
