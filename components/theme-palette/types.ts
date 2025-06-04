export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primaryForeground: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    destructive: string;
    accentForeground: string;
  };
  darkColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primaryForeground: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    destructive: string;
    accentForeground: string;
  };
  preview: string[];
}

export interface ThemePaletteContextType {
  currentPalette: ColorPalette;
  setCurrentPalette: (palette: ColorPalette) => void;
  availablePalettes: ColorPalette[];
}
