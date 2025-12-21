import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Moon, Sun, UtensilsCrossed, Sparkles, Briefcase, Star } from 'lucide-react';

const categoryOrder = [
  { id: 'delivery', label: 'Delivery', icon: UtensilsCrossed },
  { id: 'premium', label: 'Premium', icon: Sparkles },
  { id: 'corporate', label: 'Corporativo', icon: Briefcase },
  { id: 'classic', label: 'Clássicos', icon: Star },
];

export function ThemeSwitcher() {
  const { theme, setTheme, themes, isDark } = useTheme();

  const groupedThemes = categoryOrder.map(cat => ({
    ...cat,
    themes: themes.filter(t => t.category === cat.id),
  })).filter(cat => cat.themes.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-secondary/50 border-border hover:bg-secondary">
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="sr-only">Trocar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
        {groupedThemes.map((category, idx) => (
          <div key={category.id}>
            {idx > 0 && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <category.icon className="h-3 w-3" />
                {category.label}
              </p>
            </div>
            {category.themes.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id as ThemeName)}
                className="flex items-center gap-3 cursor-pointer py-2.5"
              >
                {/* Theme Preview */}
                <div 
                  className="w-10 h-10 rounded-lg border border-border/50 overflow-hidden flex-shrink-0 shadow-sm relative"
                  style={{ background: t.preview.background }}
                >
                  {/* Mode indicator */}
                  <div 
                    className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full flex items-center justify-center"
                    style={{ 
                      background: t.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    {t.isDark ? (
                      <Moon className="h-2 w-2" style={{ color: 'rgba(255,255,255,0.7)' }} />
                    ) : (
                      <Sun className="h-2 w-2" style={{ color: 'rgba(0,0,0,0.5)' }} />
                    )}
                  </div>
                  <div 
                    className="w-full h-1/2 flex items-center justify-center"
                    style={{ background: t.preview.card }}
                  >
                    <div 
                      className="w-4 h-1.5 rounded-full"
                      style={{ background: t.preview.primary }}
                    />
                  </div>
                  <div className="w-full h-1/2 flex items-center justify-center gap-1 px-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: t.preview.primary }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: t.preview.accent }}
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
                
                {theme === t.id && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
