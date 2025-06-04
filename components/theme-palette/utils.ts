import { ColorPalette } from './types';

export const applyColorPalette = (
  palette: ColorPalette,
  isDark: boolean = false
) => {
  const colors = isDark ? palette.darkColors : palette.colors;
  const root = document.documentElement;

  // Apply all color variables
  Object.entries(colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS variables
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });
};

export const saveSelectedPalette = (paletteId: string) => {
  try {
    localStorage.setItem('selected-theme-palette', paletteId);
  } catch (error) {
    console.warn('Failed to save theme palette to localStorage:', error);
  }
};

export const getSavedPalette = (): string | null => {
  try {
    return localStorage.getItem('selected-theme-palette');
  } catch (error) {
    console.warn('Failed to get theme palette from localStorage:', error);
    return null;
  }
};

export const hexToOklch = (hex: string): string => {
  // This is a simplified conversion - you might want to use a proper color conversion library
  // For now, we'll return the hex as fallback since our palettes are already in oklch
  return hex;
};
