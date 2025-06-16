/**
 * Cleans and splits a string by removing unwanted characters and words
 * @param input The input string to clean
 * @param options Configuration options for cleaning
 * @returns Array of cleaned words
 */
export function cleanAndSplitString(
  input: string,
  options: {
    removeWords?: string[]; // Words to remove (e.g., ['and', '&', 'or'])
    removeChars?: string[]; // Characters to remove (e.g., ['&', '-', '/'])
    splitOn?: string[]; // Characters to split on (e.g., [' ', '-', '/'])
  } = {}
): string[] {
  const {
    removeWords = [
      'and',
      '&',
      'or',
      'the',
      'a',
      'an',
      'in',
      'on',
      'at',
      'to',
      'from',
      'by',
      'for',
      'with',
      'as',
      'of',
    ],
    removeChars = ['&', '-', '/', '\\', '|', ','],
    splitOn = [' ', '-', '/', '\\', '|', ','],
  } = options;

  // Convert input to lowercase for consistent matching
  let cleaned = input.toLowerCase();

  // Remove specified characters
  removeChars.forEach((char) => {
    cleaned = cleaned.replace(new RegExp(`\\${char}`, 'g'), ' ');
  });

  // Split the string on specified delimiters
  let words = cleaned.split(new RegExp(`[${splitOn.join('')}]`));

  // Remove empty strings and specified words
  words = words
    .map((word) => word.trim())
    .filter(
      (word) => word.length > 0 && !removeWords.includes(word.toLowerCase())
    );

  // Capitalize first letter of each word
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
}
