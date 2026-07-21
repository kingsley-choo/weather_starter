import { createContext, useContext, useState, type ReactNode } from 'react';
import { themes, type Theme, DEFAULT_THEME_ID } from '../themes';

interface ThemeContextValue {
  theme: Theme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'weather-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID
  );

  const theme = themes.find((t) => t.id === themeId) ?? themes[0];

  function setThemeId(id: string) {
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  return <ThemeContext.Provider value={{ theme, setThemeId }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
