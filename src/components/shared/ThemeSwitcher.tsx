import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme, themes, isDark } = useTheme();

  const darkThemes = themes.filter(t => t.isDark);
  const lightThemes = themes.filter(t => !t.isDark);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-secondary/50 border-border hover:bg-secondary">
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="sr-only">Trocar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Dark Themes */}
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Moon className="h-3 w-3" />
            Temas Escuros
          </p>
        </div>
        {darkThemes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id as ThemeName)}
            className="flex items-center gap-3 cursor-pointer py-2.5"
          >
            {/* Theme Preview */}
            <div 
              className="w-10 h-10 rounded-lg border border-border/50 overflow-hidden flex-shrink-0 shadow-sm"
              style={{ background: t.preview.background }}
            >
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

        <DropdownMenuSeparator />

        {/* Light Themes */}
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Sun className="h-3 w-3" />
            Temas Claros
          </p>
        </div>
        {lightThemes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id as ThemeName)}
            className="flex items-center gap-3 cursor-pointer py-2.5"
          >
            {/* Theme Preview */}
            <div 
              className="w-10 h-10 rounded-lg border border-border/50 overflow-hidden flex-shrink-0 shadow-sm"
              style={{ background: t.preview.background }}
            >
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
