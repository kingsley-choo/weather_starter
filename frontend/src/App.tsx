import type { CSSProperties } from 'react';
import { StoreProvider } from './state/store';
import { ThemeProvider, useTheme } from './state/themeContext';
import { Layout } from './components/Layout';

function ThemedApp() {
  const { theme } = useTheme();
  return (
    <div
      className="h-full min-h-screen w-full"
      style={
        {
          ...theme.vars,
          background: 'var(--bg)',
          backgroundAttachment: 'fixed',
        } as CSSProperties
      }
    >
      <StoreProvider>
        <Layout />
      </StoreProvider>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
