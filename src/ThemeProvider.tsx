import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import { applyTheme, DEFAULT_THEME } from './themes';

interface ThemeContextType {
  activeTheme: string;
}

const ThemeContext = createContext<ThemeContextType>({ activeTheme: DEFAULT_THEME });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    // Apply default immediately to prevent flash
    applyTheme(DEFAULT_THEME);

    // Listen for real-time theme changes from Firebase
    const themeRef = ref(db, 'settings/activeTheme');
    const unsubTheme = onValue(themeRef, (snapshot) => {
      const themeId = snapshot.val() || DEFAULT_THEME;
      setActiveTheme(themeId);
      applyTheme(themeId);
    });

    // Listen for color overrides from homepage settings
    const settingsRef = ref(db, 'settings/homepage');
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const root = document.documentElement;
        if (data.primaryColor) {
          root.style.setProperty('--accent', data.primaryColor);
          // Derive a proper hover shade using color-mix (supported in all modern browsers)
          root.style.setProperty(
            '--accent-hover',
            `color-mix(in srgb, ${data.primaryColor} 85%, black)`
          );
        }
        if (data.secondaryColor) {
          root.style.setProperty('--text-price', data.secondaryColor);
        }
      }
    });

    return () => {
      unsubTheme();
      unsubSettings();
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
