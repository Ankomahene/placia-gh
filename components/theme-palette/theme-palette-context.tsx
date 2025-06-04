'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { ColorPalette, ThemePaletteContextType } from './types';
import { colorPalettes, defaultPalette } from './palettes';
import {
  applyColorPalette,
  saveSelectedPalette,
  getSavedPalette,
} from './utils';

const ThemePaletteContext = createContext<ThemePaletteContextType | undefined>(
  undefined
);

interface ThemePaletteProviderProps {
  children: React.ReactNode;
}

export function ThemePaletteProvider({ children }: ThemePaletteProviderProps) {
  const [currentPalette, setCurrentPalette] =
    useState<ColorPalette>(defaultPalette);
  const [isInitialized, setIsInitialized] = useState(false);
  const { theme } = useTheme();

  // Initialize palette from localStorage
  useEffect(() => {
    const savedPaletteId = getSavedPalette();
    if (savedPaletteId) {
      const savedPalette = colorPalettes.find((p) => p.id === savedPaletteId);
      if (savedPalette) {
        setCurrentPalette(savedPalette);
      }
    }
    setIsInitialized(true);
  }, []);

  // Apply palette whenever it changes or theme mode changes
  useEffect(() => {
    if (isInitialized) {
      const isDark = theme === 'dark';
      applyColorPalette(currentPalette, isDark);
    }
  }, [currentPalette, theme, isInitialized]);

  const handleSetCurrentPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    saveSelectedPalette(palette.id);
  };

  const value: ThemePaletteContextType = {
    currentPalette,
    setCurrentPalette: handleSetCurrentPalette,
    availablePalettes: colorPalettes,
  };

  return (
    <ThemePaletteContext.Provider value={value}>
      {children}
    </ThemePaletteContext.Provider>
  );
}

export function useThemePalette() {
  const context = useContext(ThemePaletteContext);
  if (context === undefined) {
    throw new Error(
      'useThemePalette must be used within a ThemePaletteProvider'
    );
  }
  return context;
}
