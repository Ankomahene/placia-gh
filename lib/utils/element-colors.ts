// Predefined colors for element borders
export const elementColors = [
  'border-l-rose-500',
  'border-l-pink-500',
  'border-l-fuchsia-500',
  'border-l-purple-500',
  'border-l-violet-500',
  'border-l-indigo-500',
  'border-l-blue-500',
  'border-l-sky-500',
  'border-l-cyan-500',
  'border-l-teal-500',
  'border-l-emerald-500',
  'border-l-green-500',
  'border-l-lime-500',
  'border-l-amber-500',
  'border-l-orange-500',
  'border-l-red-500',
] as const;

export function getElementColor(id: string, index: number): string {
  // Use index if provided, otherwise hash the id to get a consistent color
  if (typeof index === 'number') {
    return elementColors[index % elementColors.length];
  }

  // Simple hash function for strings
  const hash = id.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return elementColors[Math.abs(hash) % elementColors.length];
}
