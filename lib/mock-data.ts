export interface Place {
  id: string;
  name: string;
  image: string;
  address: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const featuredPlaces: Place[] = [
  {
    id: '1',
    name: 'Buka Restaurant',
    image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
    address: 'Osu, Accra',
    distance: '1.2 km',
    rating: 4.7,
    isOpen: true,
    category: 'Restaurants',
  },
  {
    id: '2',
    name: 'Kempinski Hotel',
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
    address: 'Gold Coast City, Accra',
    distance: '3.8 km',
    rating: 4.9,
    isOpen: true,
    category: 'Hotels',
  },
  {
    id: '3',
    name: 'Makola Market',
    image: 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg',
    address: 'Central Accra',
    distance: '2.5 km',
    rating: 4.3,
    isOpen: true,
    category: 'Shopping',
  },
  {
    id: '4',
    name: 'Accra Mall',
    image: 'https://images.pexels.com/photos/1050244/pexels-photo-1050244.jpeg',
    address: 'Tetteh Quarshie, Accra',
    distance: '5.1 km',
    rating: 4.5,
    isOpen: true,
    category: 'Shopping',
  },
  {
    id: '5',
    name: 'Labadi Beach',
    image: 'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg',
    address: 'La, Accra',
    distance: '6.3 km',
    rating: 4.4,
    isOpen: true,
    category: 'Beaches',
  },
];

export const trendingPlaces: Place[] = [
  {
    id: '6',
    name: 'Republic Bar & Grill',
    image: 'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg',
    address: 'Osu, Accra',
    distance: '1.8 km',
    rating: 4.6,
    isOpen: true,
    category: 'Nightlife',
  },
  {
    id: '7',
    name: 'Legon Botanical Gardens',
    image:
      'https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg',
    address: 'University of Ghana, Legon',
    distance: '7.2 km',
    rating: 4.5,
    isOpen: true,
    category: 'Parks',
  },
  {
    id: '8',
    name: 'Jamestown Lighthouse',
    image: 'https://images.pexels.com/photos/1532771/pexels-photo-1532771.jpeg',
    address: 'Jamestown, Accra',
    distance: '3.4 km',
    rating: 4.2,
    isOpen: true,
    category: 'Attractions',
  },
  {
    id: '9',
    name: 'Kwame Nkrumah Memorial Park',
    image: 'https://images.pexels.com/photos/4350631/pexels-photo-4350631.jpeg',
    address: 'Central Accra',
    distance: '2.8 km',
    rating: 4.7,
    isOpen: false,
    category: 'Museums',
  },
  {
    id: '10',
    name: 'Oxford Street',
    image: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg',
    address: 'Osu, Accra',
    distance: '1.5 km',
    rating: 4.3,
    isOpen: true,
    category: 'Shopping',
  },
];

export const popularCategories: Category[] = [
  { id: '1', name: 'Restaurants', icon: 'utensils', count: 238 },
  { id: '2', name: 'Hotels', icon: 'hotel', count: 112 },
  { id: '3', name: 'Shopping', icon: 'shopping-bag', count: 186 },
  { id: '4', name: 'Banks', icon: 'landmark', count: 97 },
  { id: '5', name: 'Hospitals', icon: 'hospital', count: 64 },
  { id: '6', name: 'Schools', icon: 'school', count: 145 },
  { id: '7', name: 'Churches', icon: 'church', count: 203 },
  { id: '8', name: 'Beaches', icon: 'umbrella-beach', count: 18 },
  { id: '9', name: 'Parks', icon: 'tree', count: 42 },
  { id: '10', name: 'Gyms', icon: 'dumbbell', count: 76 },
  { id: '11', name: 'Pharmacies', icon: 'pills', count: 89 },
  { id: '12', name: 'Gas Stations', icon: 'gas-pump', count: 54 },
];

// Export all places combined as mockPlaces for favorites components
export const mockPlaces: Place[] = [...featuredPlaces, ...trendingPlaces];

// Recently viewed places for dashboard
export const recentlyViewedPlaces: Place[] = [
  ...featuredPlaces.slice(0, 3),
  ...trendingPlaces.slice(0, 2),
];
