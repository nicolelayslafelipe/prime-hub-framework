import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'premium-dark' | 'premium-light' | 'dark-emerald' | 'light-sapphire';

interface ThemeInfo {
  id: ThemeName;
  name: string;
  description: string;
  isDark: boolean;
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
}

const themes: ThemeInfo[] = [
  { 
    id: 'premium-dark', 
    name: 'Dark Gold', 
    description: 'Elegante escuro com dourado',
    isDark: true,
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
    preview: {
      background: 'hsl(220 25% 97%)',
      card: 'hsl(0 0% 100%)',
      primary: 'hsl(220 72% 50%)',
      accent: 'hsl(185 60% 42%)',
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

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('premium-dark', 'premium-light', 'dark-emerald', 'light-sapphire');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist to localStorage
    localStorage.setItem('deliveryos-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, isDark: currentTheme.isDark }}>
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
