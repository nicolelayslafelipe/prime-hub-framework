import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeName = 
  | 'premium-dark' | 'premium-light' | 'dark-emerald' | 'light-sapphire'
  | 'appetite' | 'fresh-clean' | 'gourmet' | 'dark-premium' | 'light-modern';

interface ThemeInfo {
  id: ThemeName;
  name: string;
  description: string;
  isDark: boolean;
  category: 'delivery' | 'premium' | 'corporate' | 'classic';
  preview: {
    background: string;
    card: string;
    primary: string;
    accent: string;
  };
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeInfo[];
  isDark: boolean;
  isLoading: boolean;
}

const themes: ThemeInfo[] = [
  // Classic Themes
  { 
    id: 'premium-dark', 
    name: 'Dark Gold', 
    description: 'Elegante escuro com dourado',
    isDark: true,
    category: 'classic',
    preview: {
      background: 'hsl(220 16% 6%)',
      card: 'hsl(220 14% 9%)',
      primary: 'hsl(42 85% 55%)',
      accent: 'hsl(158 70% 45%)',
    }
  },
  { 
    id: 'premium-light', 
    name: 'Light Bronze', 
    description: 'Sofisticado claro com bronze',
    isDark: false,
    category: 'classic',
    preview: {
      background: 'hsl(40 25% 97%)',
      card: 'hsl(0 0% 100%)',
      primary: 'hsl(30 65% 45%)',
      accent: 'hsl(165 55% 38%)',
    }
  },
  { 
    id: 'dark-emerald', 
    name: 'Dark Emerald', 
    description: 'Escuro com verde esmeralda',
    isDark: true,
    category: 'classic',
    preview: {
      background: 'hsl(160 18% 5%)',
      card: 'hsl(160 14% 8%)',
      primary: 'hsl(158 75% 42%)',
      accent: 'hsl(42 85% 55%)',
    }
  },
  { 
    id: 'light-sapphire', 
    name: 'Light Sapphire', 
    description: 'Claro com azul safira',
    isDark: false,
    category: 'classic',
    preview: {
      background: 'hsl(220 25% 97%)',
      card: 'hsl(0 0% 100%)',
      primary: 'hsl(220 72% 50%)',
      accent: 'hsl(185 60% 42%)',
    }
  },
  // Delivery Themes
  { 
    id: 'appetite', 
    name: 'Appetite', 
    description: 'Vermelho e laranja vibrante',
    isDark: true,
    category: 'delivery',
    preview: {
      background: 'hsl(0 0% 7%)',
      card: 'hsl(0 0% 10%)',
      primary: 'hsl(4 90% 58%)',
      accent: 'hsl(24 100% 50%)',
    }
  },
  { 
    id: 'fresh-clean', 
    name: 'Fresh & Clean', 
    description: 'Verde vibrante com cinza moderno',
    isDark: false,
    category: 'delivery',
    preview: {
      background: 'hsl(0 0% 98%)',
      card: 'hsl(0 0% 100%)',
      primary: 'hsl(145 100% 39%)',
      accent: 'hsl(200 18% 46%)',
    }
  },
  // Premium Themes
  { 
    id: 'gourmet', 
    name: 'Gourmet', 
    description: 'Marrom e dourado sofisticado',
    isDark: true,
    category: 'premium',
    preview: {
      background: 'hsl(16 25% 6%)',
      card: 'hsl(16 20% 10%)',
      primary: 'hsl(16 30% 30%)',
      accent: 'hsl(45 100% 50%)',
    }
  },
  { 
    id: 'dark-premium', 
    name: 'Dark Premium', 
    description: 'Preto com roxo moderno',
    isDark: true,
    category: 'premium',
    preview: {
      background: 'hsl(0 0% 7%)',
      card: 'hsl(0 0% 10%)',
      primary: 'hsl(265 90% 76%)',
      accent: 'hsl(174 100% 41%)',
    }
  },
  // Corporate Themes
  { 
    id: 'light-modern', 
    name: 'Light Modern', 
    description: 'Branco limpo com azul corporativo',
    isDark: false,
    category: 'corporate',
    preview: {
      background: 'hsl(0 0% 98%)',
      card: 'hsl(0 0% 100%)',
      primary: 'hsl(207 90% 54%)',
      accent: 'hsl(199 89% 48%)',
    }
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('deliveryos-theme') as ThemeName) || 'premium-dark';
    }
    return 'premium-dark';
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  // Fetch theme from database on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('establishment_settings')
          .select('selected_theme')
          .single();

        if (!error && data?.selected_theme) {
          const validTheme = themes.find(t => t.id === data.selected_theme);
          if (validTheme) {
            setThemeState(data.selected_theme as ThemeName);
            localStorage.setItem('deliveryos-theme', data.selected_theme);
          }
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('theme-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'establishment_settings',
        },
        (payload) => {
          const newTheme = (payload.new as any)?.selected_theme;
          if (newTheme) {
            const validTheme = themes.find(t => t.id === newTheme);
            if (validTheme) {
              setThemeState(newTheme as ThemeName);
              localStorage.setItem('deliveryos-theme', newTheme);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    const allThemeClasses = themes.map(t => t.id);
    root.classList.remove(...allThemeClasses);
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist to localStorage as fallback
    localStorage.setItem('deliveryos-theme', theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    
    // Save to database
    try {
      const { error } = await supabase
        .from('establishment_settings')
        .update({ selected_theme: newTheme })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) {
        console.error('Error saving theme:', error);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, isDark: currentTheme.isDark, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
