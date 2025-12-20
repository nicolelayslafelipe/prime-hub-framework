import { AdminLayout } from '@/components/admin/AdminLayout';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { Check, Moon, Sun, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminThemes() {
  const { theme, setTheme, themes, isDark } = useTheme();

  const darkThemes = themes.filter(t => t.isDark);
  const lightThemes = themes.filter(t => !t.isDark);

  return (
    <AdminLayout 
      title="Temas" 
      subtitle="Personalize a aparência do sistema"
    >
      <div className="max-w-4xl space-y-8">
        {/* Current Theme Status */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Tema Atual</h3>
              <p className="text-sm text-muted-foreground">
                {themes.find(t => t.id === theme)?.name} - {isDark ? 'Modo Escuro' : 'Modo Claro'}
              </p>
            </div>
          </div>
        </div>

        {/* Dark Themes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Temas Escuros</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Temas premium com fundo escuro, ideais para uso noturno ou ambientes com pouca luz.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {darkThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeName)}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all duration-300 hover:scale-[1.02]',
                  theme === t.id
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Selected indicator */}
                {theme === t.id && (
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                {/* Theme Preview */}
                <div 
                  className="w-full h-32 rounded-lg overflow-hidden border border-border/50 mb-4"
                  style={{ background: t.preview.background }}
                >
                  {/* Fake UI Preview */}
                  <div className="h-8 border-b border-white/10 flex items-center px-3 gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: t.preview.primary }} />
                    <div className="h-2 w-16 rounded bg-white/20" />
                  </div>
                  <div className="p-3 flex gap-3">
                    {/* Sidebar preview */}
                    <div className="w-12 space-y-2">
                      <div className="h-2 w-full rounded bg-white/10" />
                      <div className="h-2 w-full rounded" style={{ background: t.preview.primary + '40' }} />
                      <div className="h-2 w-full rounded bg-white/10" />
                    </div>
                    {/* Content preview */}
                    <div className="flex-1 space-y-2">
                      <div 
                        className="h-16 rounded-lg p-2 flex items-end justify-between"
                        style={{ background: t.preview.card }}
                      >
                        <div className="space-y-1">
                          <div className="h-2 w-20 rounded bg-white/30" />
                          <div className="h-1.5 w-12 rounded bg-white/15" />
                        </div>
                        <div 
                          className="h-5 w-12 rounded-md"
                          style={{ background: t.preview.primary }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div 
                          className="h-6 w-6 rounded"
                          style={{ background: t.preview.accent }}
                        />
                        <div 
                          className="h-6 flex-1 rounded"
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
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.primary }}
                    title="Cor Primária"
                  />
                  <div 
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.accent }}
                    title="Cor de Destaque"
                  />
                  <div 
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.card }}
                    title="Cor do Card"
                  />
                  <div 
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.background }}
                    title="Cor de Fundo"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Light Themes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Temas Claros</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Temas premium com fundo claro, ideais para ambientes bem iluminados.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {lightThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeName)}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all duration-300 hover:scale-[1.02]',
                  theme === t.id
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Selected indicator */}
                {theme === t.id && (
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                {/* Theme Preview */}
                <div 
                  className="w-full h-32 rounded-lg overflow-hidden border border-border/50 mb-4"
                  style={{ background: t.preview.background }}
                >
                  {/* Fake UI Preview */}
                  <div 
                    className="h-8 border-b flex items-center px-3 gap-2"
                    style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ background: t.preview.primary }} />
                    <div className="h-2 w-16 rounded bg-black/10" />
                  </div>
                  <div className="p-3 flex gap-3">
                    {/* Sidebar preview */}
                    <div className="w-12 space-y-2">
                      <div className="h-2 w-full rounded bg-black/10" />
                      <div className="h-2 w-full rounded" style={{ background: t.preview.primary + '40' }} />
                      <div className="h-2 w-full rounded bg-black/10" />
                    </div>
                    {/* Content preview */}
                    <div className="flex-1 space-y-2">
                      <div 
                        className="h-16 rounded-lg p-2 flex items-end justify-between shadow-sm"
                        style={{ background: t.preview.card }}
                      >
                        <div className="space-y-1">
                          <div className="h-2 w-20 rounded bg-black/20" />
                          <div className="h-1.5 w-12 rounded bg-black/10" />
                        </div>
                        <div 
                          className="h-5 w-12 rounded-md"
                          style={{ background: t.preview.primary }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div 
                          className="h-6 w-6 rounded"
                          style={{ background: t.preview.accent }}
                        />
                        <div 
                          className="h-6 flex-1 rounded shadow-sm"
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
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.primary }}
                    title="Cor Primária"
                  />
                  <div 
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.accent }}
                    title="Cor de Destaque"
                  />
                  <div 
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.card }}
                    title="Cor do Card"
                  />
                  <div 
                    className="h-4 w-4 rounded-full border border-border/50"
                    style={{ background: t.preview.background }}
                    title="Cor de Fundo"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card-premium p-4 text-sm text-muted-foreground">
          <p>
            💡 O tema selecionado é aplicado automaticamente em todo o sistema e salvo no seu navegador.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
