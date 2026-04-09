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
    const unsub = onValue(themeRef, (snapshot) => {
      const themeId = snapshot.val() || DEFAULT_THEME;
      setActiveTheme(themeId);
      applyTheme(themeId);
    });

    return () => unsub();
  }, []);

  return (
    <ThemeContext.Provider value={{ activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
