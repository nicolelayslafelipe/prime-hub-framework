import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'premium-dark' | 'premium-light' | 'dark-emerald';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { id: ThemeName; name: string; description: string }[];
}

const themes = [
  { id: 'premium-dark' as ThemeName, name: 'Premium Dark', description: 'Elegante escuro com dourado' },
  { id: 'premium-light' as ThemeName, name: 'Premium Light', description: 'Sofisticado claro com bronze' },
  { id: 'dark-emerald' as ThemeName, name: 'Dark Emerald', description: 'Escuro com verde esmeralda' },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('deliveryos-theme') as ThemeName) || 'premium-dark';
    }
    return 'premium-dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('premium-dark', 'premium-light', 'dark-emerald');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist to localStorage
    localStorage.setItem('deliveryos-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
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
