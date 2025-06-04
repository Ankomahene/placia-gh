export { ThemePaletteProvider, useThemePalette } from './theme-palette-context';
export { ThemePaletteSelector } from './theme-palette-selector';
export { colorPalettes, defaultPalette } from './palettes';
export type { ColorPalette, ThemePaletteContextType } from './types';
export {
  applyColorPalette,
  saveSelectedPalette,
  getSavedPalette,
} from './utils';
