export const getRatingLabel = (rating?: number) => {
  if (!rating) return { label: '', color: 'text-muted-foreground' };

  if (rating >= 4.5) {
    return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
  } else if (rating >= 4) {
    return { label: 'Very Good', color: 'text-blue-600 dark:text-blue-400' };
  } else if (rating >= 3) {
    return { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400' };
  } else if (rating >= 2) {
    return { label: 'Fair', color: 'text-orange-600 dark:text-orange-400' };
  } else {
    return { label: 'Poor', color: 'text-red-600 dark:text-red-400' };
  }
};

export const getPriceLevelLabel = (priceLevel?: number) => {
  if (!priceLevel) return { label: '', symbol: '', color: '' };

  switch (priceLevel) {
    case 4:
      return {
        label: 'Very Expensive',
        symbol: '$$$$',
        color: 'text-purple-600 dark:text-purple-400',
      };
    case 3:
      return {
        label: 'Expensive',
        symbol: '$$$',
        color: 'text-orange-600 dark:text-orange-400',
      };
    case 2:
      return {
        label: 'Moderate',
        symbol: '$$',
        color: 'text-blue-600 dark:text-blue-400',
      };
    case 1:
      return {
        label: 'Budget',
        symbol: '$',
        color: 'text-green-600 dark:text-green-400',
      };
    default:
      return { label: '', symbol: '', color: '' };
  }
};

export const getOpenStatusColor = (isOpen: boolean | string | undefined) => {
  if (isOpen === undefined || isOpen === 'unknown') return '';

  return isOpen
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
};

export const getOpenStatusBadgeColor = (
  isOpen: boolean | string | undefined
) => {
  if (isOpen === undefined || isOpen === 'unknown') return '';

  return isOpen
    ? 'bg-green-500/90 hover:bg-green-500 text-white border-0'
    : 'bg-red-500/90 hover:bg-red-500 text-white border-0';
};

export const formatOpenStatus = (isOpen: boolean | string | undefined) => {
  if (isOpen === undefined || isOpen === 'unknown') return '';

  return isOpen ? 'Open now' : 'Closed';
};

export const formatPriceSymbol = (priceLevel?: number) => {
  const priceInfo = getPriceLevelLabel(priceLevel);
  return priceInfo.symbol;
};

// Dark theme gradient utilities for cards
export const getRatingCardGradient = () =>
  'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30';

export const getPriceCardGradient = () =>
  'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30';

export const getStatusCardGradient = (isOpen: boolean | string | undefined) => {
  if (isOpen === undefined || isOpen === 'unknown') return '';

  return isOpen
    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
    : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30';
};

// Dark theme safe muted backgrounds
export function getMutedBackground(): string {
  return 'bg-muted/20 dark:bg-muted/40';
}

export const getMutedBackgroundHover = () =>
  'bg-muted/30 hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/30';

// Dark theme safe card backgrounds
export const getCardBackground = () => 'bg-card dark:bg-card';

export const getGlassBackground = () =>
  'bg-background/95 dark:bg-background/95 backdrop-blur-sm';

/**
 * Generate a URL for place details page
 * @param place - Place data that could be from Google or platform database
 * @returns URL string for the place details page
 */
export function getPlaceDetailsUrl(place: {
  id: string;
  slug?: string;
  name?: string;
  source?: string;
  google_place_id?: string;
}): string {
  // Determine the source and ID to use
  const isGooglePlace =
    place.source === 'google' ||
    place.source === 'google_places' ||
    place.source === 'google_places_details';

  if (isGooglePlace && place.google_place_id) {
    // For Google places, use the Google place ID
    return `/place/${encodeURIComponent(place.google_place_id)}?source=google`;
  } else if (isGooglePlace && !place.google_place_id) {
    // Fallback for Google places without google_place_id (use the regular ID)
    return `/place/${encodeURIComponent(place.id)}?source=google`;
  } else {
    // For platform database places
    return `/place/${encodeURIComponent(place.id)}?source=platform`;
  }
}

/**
 * Opening hours utilities
 */

// Days order for consistent sorting
export const DAYS_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Get current day of the week
export function getCurrentDay(): string {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[new Date().getDay()];
}

// Sort opening hours by days of the week
export function sortOpeningHours(
  hours: { day: string; from: string; to: string }[]
) {
  return [...hours].sort(
    (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
  );
}

// Check if place is open 24/7
export function isOpen24Hours(hours: { from: string; to: string }): boolean {
  return hours.from === '00:00' && hours.to === '23:59';
}

// Validate opening hours entry
export function isValidHours(hours: { from: string; to: string }): boolean {
  if (!hours.from || !hours.to) return false;

  // Check if times are in valid format
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(hours.from) || !timeRegex.test(hours.to)) return false;

  // Check if same times (likely parsing error)
  if (hours.from === hours.to && !isOpen24Hours(hours)) {
    console.warn('Invalid hours detected - same from/to time:', hours);
    return false;
  }

  return true;
}

// Format time for display (24-hour to 12-hour)
export function formatTime(time: string): string {
  if (!time || typeof time !== 'string') return '-';

  // Handle 24-hour format (HH:MM)
  const timeParts = time.split(':');
  if (timeParts.length !== 2) return '-';

  const [hoursStr, minutesStr] = timeParts;
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // Validate hours and minutes
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return '-';
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHour}:${displayMinutes} ${ampm}`;
}

// Format opening hours for simple display (used in place-info)
export function formatHoursSimple(hours: { from: string; to: string }): string {
  if (isOpen24Hours(hours)) {
    return 'Open 24 hours';
  }

  const fromTime = formatTime(hours.from);
  const toTime = formatTime(hours.to);

  if (fromTime === '-' || toTime === '-') {
    return 'Hours not available';
  }

  return `${fromTime} - ${toTime}`;
}
