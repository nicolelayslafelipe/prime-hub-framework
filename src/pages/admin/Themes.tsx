import { AdminLayout } from '@/components/admin/AdminLayout';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { Check, Moon, Sun, Palette, UtensilsCrossed, Sparkles, Briefcase, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CategorySection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  themes: string[];
}

const categories: CategorySection[] = [
  {
    id: 'delivery',
    name: 'Delivery',
    description: 'Temas vibrantes inspirados nos principais apps de delivery',
    icon: <UtensilsCrossed className="h-5 w-5" />,
    themes: ['appetite', 'fresh-clean'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Temas sofisticados para restaurantes de alto padrão',
    icon: <Sparkles className="h-5 w-5" />,
    themes: ['gourmet', 'dark-premium'],
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Temas limpos e profissionais para empresas',
    icon: <Briefcase className="h-5 w-5" />,
    themes: ['light-modern'],
  },
  {
    id: 'classic',
    name: 'Clássicos',
    description: 'Temas elegantes com paletas atemporais',
    icon: <Star className="h-5 w-5" />,
    themes: ['premium-dark', 'premium-light', 'dark-emerald', 'light-sapphire'],
  },
];

export default function AdminThemes() {
  const { theme, setTheme, themes, isDark, isLoading } = useTheme();

  const handleThemeSelect = async (themeId: ThemeName) => {
    try {
      await setTheme(themeId);
      const themeName = themes.find(t => t.id === themeId)?.name;
      toast.success(`Tema "${themeName}" aplicado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao aplicar tema');
    }
  };

  const ThemeCard = ({ t }: { t: typeof themes[0] }) => {
    const isSelected = theme === t.id;
    const isLightTheme = !t.isDark;

    return (
      <button
        onClick={() => handleThemeSelect(t.id)}
        className={cn(
          'relative rounded-xl border-2 p-4 text-left transition-all duration-300 hover:scale-[1.02] group',
          isSelected
            ? 'border-primary shadow-lg shadow-primary/20'
            : 'border-border hover:border-primary/50'
        )}
      >
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center z-10">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}

        {/* Theme Preview */}
        <div 
          className="w-full h-32 rounded-lg overflow-hidden border border-border/50 mb-4 relative"
          style={{ background: t.preview.background }}
        >
          {/* Mode indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs" 
            style={{ 
              background: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: t.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'
            }}
          >
            {t.isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            {t.isDark ? 'Dark' : 'Light'}
          </div>

          {/* Fake UI Preview */}
          <div 
            className="h-8 border-b flex items-center px-3 gap-2 mt-8"
            style={{ borderColor: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
          >
            <div className="h-3 w-3 rounded-full" style={{ background: t.preview.primary }} />
            <div className="h-2 w-16 rounded" style={{ background: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="p-3 flex gap-3">
            {/* Sidebar preview */}
            <div className="w-12 space-y-2">
              <div className="h-2 w-full rounded" style={{ background: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
              <div className="h-2 w-full rounded" style={{ background: t.preview.primary + '40' }} />
              <div className="h-2 w-full rounded" style={{ background: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
            </div>
            {/* Content preview */}
            <div className="flex-1 space-y-2">
              <div 
                className="h-12 rounded-lg p-2 flex items-end justify-between"
                style={{ background: t.preview.card }}
              >
                <div className="space-y-1">
                  <div className="h-2 w-16 rounded" style={{ background: isLightTheme ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }} />
                  <div className="h-1.5 w-10 rounded" style={{ background: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }} />
                </div>
                <div 
                  className="h-5 w-10 rounded-md"
                  style={{ background: t.preview.primary }}
                />
              </div>
              <div className="flex gap-2">
                <div 
                  className="h-5 w-5 rounded"
                  style={{ background: t.preview.accent }}
                />
                <div 
                  className="h-5 flex-1 rounded"
                  style={{ background: t.preview.card }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Info */}
        <div>
          <h3 className="font-semibold text-foreground">{t.name}</h3>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        {/* Color swatches */}
        <div className="flex gap-2 mt-3">
          <div 
            className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
            style={{ background: t.preview.primary }}
            title="Cor Primária"
          />
          <div 
            className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
            style={{ background: t.preview.accent }}
            title="Cor de Destaque"
          />
          <div 
            className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
            style={{ background: t.preview.card }}
            title="Cor do Card"
          />
          <div 
            className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
            style={{ background: t.preview.background }}
            title="Cor de Fundo"
          />
        </div>
      </button>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="Temas Visuais" subtitle="Personalize a aparência do sistema">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Temas Visuais" 
      subtitle="Personalize a aparência do sistema"
    >
      <div className="max-w-5xl space-y-8">
        {/* Current Theme Status */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Tema Atual</h3>
              <p className="text-sm text-muted-foreground">
                {themes.find(t => t.id === theme)?.name} • {isDark ? 'Modo Escuro' : 'Modo Claro'}
              </p>
            </div>
            <div className="flex gap-2">
              <div 
                className="h-8 w-8 rounded-full border-2 border-border shadow-sm"
                style={{ background: themes.find(t => t.id === theme)?.preview.primary }}
              />
              <div 
                className="h-8 w-8 rounded-full border-2 border-border shadow-sm"
                style={{ background: themes.find(t => t.id === theme)?.preview.accent }}
              />
            </div>
          </div>
        </div>

        {/* Theme Categories */}
        {categories.map((category) => {
          const categoryThemes = themes.filter(t => category.themes.includes(t.id));
          if (categoryThemes.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryThemes.map((t) => (
                  <ThemeCard key={t.id} t={t} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Info */}
        <div className="card-premium p-4 text-sm text-muted-foreground flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-primary/10 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Sincronização Global</p>
            <p>
              O tema selecionado é aplicado automaticamente em todo o sistema — cardápio, painel admin, 
              login e todos os componentes. A mudança é sincronizada em tempo real para todos os usuários.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
