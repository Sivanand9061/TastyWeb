// Theme definitions — each theme is a set of CSS custom properties
export interface ThemeConfig {
  id: string;
  name: string;
  emoji: string;
  colors: Record<string, string>;
}

export const themes: ThemeConfig[] = [
  {
    id: 'classic-red',
    name: 'Classic Red',
    emoji: '🔴',
    colors: {
      '--bg-primary': '#fbf4e8',
      '--bg-card': '#ffffff',
      '--bg-card-border': '#e0e0e0',
      '--bg-input-border': '#d1d1d1',
      '--accent': '#f51c27',
      '--accent-hover': '#d90429',
      '--text-primary': '#1c1c1a',
      '--text-secondary': '#727272',
      '--text-price': '#1caa00',
      '--topbar-bg': 'rgba(157,157,157,0.26)',
      '--topbar-shadow': '0px 2px 9.7px 0px rgba(0,0,0,0.25)',
      '--btn-add-bg': 'rgba(157,157,157,0.26)',
      '--btn-add-hover': 'rgba(157,157,157,0.35)',
      '--category-underline': '#626262',
      '--info-border': '#d1d1d1',
      '--item-border': '#d0d0d0',
      '--img-placeholder-from': '#ffe8e8',
      '--img-placeholder-to': '#ffd0d0',
      '--toast-bg': '#1caa00',
    },
  },
  {
    id: 'dark-gold',
    name: 'Dark Gold',
    emoji: '🌙',
    colors: {
      '--bg-primary': '#141414',
      '--bg-card': '#1e1e1e',
      '--bg-card-border': '#333333',
      '--bg-input-border': '#444444',
      '--accent': '#D4A853',
      '--accent-hover': '#c49a43',
      '--text-primary': '#f0f0f0',
      '--text-secondary': '#999999',
      '--text-price': '#D4A853',
      '--topbar-bg': 'rgba(30,30,30,0.85)',
      '--topbar-shadow': '0px 2px 12px 0px rgba(0,0,0,0.5)',
      '--btn-add-bg': 'rgba(212,168,83,0.15)',
      '--btn-add-hover': 'rgba(212,168,83,0.25)',
      '--category-underline': '#D4A853',
      '--info-border': '#333333',
      '--item-border': '#2a2a2a',
      '--img-placeholder-from': '#2a2520',
      '--img-placeholder-to': '#3a3025',
      '--toast-bg': '#D4A853',
    },
  },
  {
    id: 'fresh-green',
    name: 'Fresh Green',
    emoji: '🍃',
    colors: {
      '--bg-primary': '#f8faf9',
      '--bg-card': '#ffffff',
      '--bg-card-border': '#e5e7eb',
      '--bg-input-border': '#d1d5db',
      '--accent': '#059669',
      '--accent-hover': '#047857',
      '--text-primary': '#1f2937',
      '--text-secondary': '#6b7280',
      '--text-price': '#059669',
      '--topbar-bg': 'rgba(255,255,255,0.85)',
      '--topbar-shadow': '0px 1px 8px 0px rgba(0,0,0,0.1)',
      '--btn-add-bg': 'rgba(5,150,105,0.1)',
      '--btn-add-hover': 'rgba(5,150,105,0.2)',
      '--category-underline': '#059669',
      '--info-border': '#e5e7eb',
      '--item-border': '#e5e7eb',
      '--img-placeholder-from': '#ecfdf5',
      '--img-placeholder-to': '#d1fae5',
      '--toast-bg': '#059669',
    },
  },
];

export const DEFAULT_THEME = 'classic-red';

export function getThemeById(id: string): ThemeConfig {
  return themes.find(t => t.id === id) || themes[0];
}

export function applyTheme(themeId: string) {
  const theme = getThemeById(themeId);
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
