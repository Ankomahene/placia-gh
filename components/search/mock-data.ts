import {
  Place,
  PlaceCategory,
  PlaceSubcategory,
  PlaceResultsSummary,
} from '@/types/place';

export const mockCategories: PlaceCategory[] = [
  {
    id: '1',
    name: 'Restaurants',
    slug: 'restaurants',
    icon: 'UtensilsCrossed',
    description: 'Dining and food establishments',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    name: 'Hotels',
    slug: 'hotels',
    icon: 'Hotel',
    description: 'Accommodation and lodging',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '3',
    name: 'Attractions',
    slug: 'attractions',
    icon: 'MapPin',
    description: 'Tourist attractions and landmarks',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '4',
    name: 'Shopping',
    slug: 'shopping',
    icon: 'ShoppingBag',
    description: 'Shopping centers and markets',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export const mockSubcategories: PlaceSubcategory[] = [
  {
    id: '1',
    category_id: '1',
    name: 'Local Cuisine',
    slug: 'local-cuisine',
    icon: 'ChefHat',
    description: 'Traditional Ghanaian restaurants',
    grouping_id: '1',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    category_id: '1',
    name: 'International',
    slug: 'international',
    icon: 'Globe',
    description: 'International cuisine',
    grouping_id: '1',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '3',
    category_id: '2',
    name: 'Luxury Hotels',
    slug: 'luxury-hotels',
    icon: 'Crown',
    description: 'Premium accommodation',
    grouping_id: '2',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '4',
    category_id: '3',
    name: 'Historical Sites',
    slug: 'historical-sites',
    icon: 'Landmark',
    description: 'Historical landmarks',
    grouping_id: '3',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '5',
    category_id: '4',
    name: 'Shopping Centers',
    slug: 'shopping-centers',
    icon: 'Building',
    description: 'Modern shopping complexes',
    grouping_id: '4',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'Labadi Beach Hotel',
    slug: 'labadi-beach-hotel',
    tagline: 'Luxury beachfront resort in Accra',
    description:
      'A premier beachfront hotel offering world-class amenities and stunning ocean views.',
    contacts: ['+233-302-772-501', '+233-302-772-502'],
    email: 'info@labadibeach.com',
    icon: 'Hotel',
    logo: '/images/places/labadi-beach-logo.jpg',
    main_image: '/images/places/labadi-beach-main.jpg',
    gallery: [
      '/images/places/labadi-beach-1.jpg',
      '/images/places/labadi-beach-2.jpg',
      '/images/places/labadi-beach-3.jpg',
    ],
    country_id: 'gh',
    region_id: 'greater-accra',
    city_id: 'accra',
    location: {
      lng: -0.1276,
      lat: 5.5502,
      name: 'Labadi Beach',
      street_address: 'Labadi Beach Road, Accra',
    },
    website: 'https://labadibeach.com',
    socials: [
      { platform_name: 'facebook', link: 'https://facebook.com/labadibeach' },
      { platform_name: 'instagram', link: 'https://instagram.com/labadibeach' },
    ],
    category_id: '2',
    subcategory_id: '3',
    type_id: 'luxury-hotel',
    ownership_id: 'private',
    rating: { rate: 4.5, count: 1248 },
    open_hours: [
      { day: 'Monday', from: '00:00', to: '23:59' },
      { day: 'Tuesday', from: '00:00', to: '23:59' },
      { day: 'Wednesday', from: '00:00', to: '23:59' },
      { day: 'Thursday', from: '00:00', to: '23:59' },
      { day: 'Friday', from: '00:00', to: '23:59' },
      { day: 'Saturday', from: '00:00', to: '23:59' },
      { day: 'Sunday', from: '00:00', to: '23:59' },
    ],
    features: [
      { label: 'Beach Access', icon: 'Waves' },
      { label: 'Pool', icon: 'Swimming' },
      { label: 'Spa', icon: 'Spa' },
      { label: 'Restaurant', icon: 'UtensilsCrossed' },
    ],
    services: [
      { label: 'Room Service', icon: 'ConciergeBell' },
      { label: 'Laundry', icon: 'Shirt' },
      { label: 'Airport Shuttle', icon: 'Car' },
    ],
    tags: ['luxury', 'beach', 'business', 'family-friendly'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'Accessibility' },
      { label: 'Elevator', icon: 'MoveVertical' },
    ],
    created_at: new Date(),
    updated_at: new Date(),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '2',
    name: 'Buka Restaurant',
    slug: 'buka-restaurant',
    tagline: 'Authentic Ghanaian cuisine in the heart of Osu',
    description:
      'Experience the best of Ghanaian traditional dishes in a modern, vibrant setting.',
    contacts: ['+233-302-123-456'],
    email: 'info@bukarestaurant.com',
    icon: 'UtensilsCrossed',
    main_image: '/images/places/buka-main.jpg',
    gallery: ['/images/places/buka-1.jpg', '/images/places/buka-2.jpg'],
    country_id: 'gh',
    region_id: 'greater-accra',
    city_id: 'accra',
    location: {
      lng: -0.1276,
      lat: 5.5502,
      name: 'Osu',
      street_address: 'Oxford Street, Osu, Accra',
    },
    website: 'https://bukarestaurant.com',
    category_id: '1',
    subcategory_id: '1',
    rating: { rate: 4.2, count: 892 },
    open_hours: [
      { day: 'Monday', from: '11:00', to: '22:00' },
      { day: 'Tuesday', from: '11:00', to: '22:00' },
      { day: 'Wednesday', from: '11:00', to: '22:00' },
      { day: 'Thursday', from: '11:00', to: '22:00' },
      { day: 'Friday', from: '11:00', to: '23:00' },
      { day: 'Saturday', from: '11:00', to: '23:00' },
      { day: 'Sunday', from: '12:00', to: '21:00' },
    ],
    features: [
      { label: 'Outdoor Seating', icon: 'TreePine' },
      { label: 'Live Music', icon: 'Music' },
      { label: 'Air Conditioning', icon: 'Snowflake' },
    ],
    services: [
      { label: 'Takeaway', icon: 'ShoppingBag' },
      { label: 'Delivery', icon: 'Truck' },
    ],
    tags: ['local-cuisine', 'traditional', 'family-friendly', 'group-dining'],
    created_at: new Date(),
    updated_at: new Date(),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '3',
    name: 'Kwame Nkrumah Memorial Park',
    slug: 'kwame-nkrumah-memorial-park',
    tagline: "Historic memorial dedicated to Ghana's first president",
    description:
      'A beautiful park and mausoleum dedicated to Dr. Kwame Nkrumah, the first President of Ghana.',
    contacts: ['+233-302-666-751'],
    icon: 'Landmark',
    main_image: '/images/places/nkrumah-memorial-main.jpg',
    gallery: [
      '/images/places/nkrumah-memorial-1.jpg',
      '/images/places/nkrumah-memorial-2.jpg',
    ],
    country_id: 'gh',
    region_id: 'greater-accra',
    city_id: 'accra',
    location: {
      lng: -0.2218,
      lat: 5.5502,
      name: 'High Street',
      street_address: 'High Street, Accra',
    },
    category_id: '3',
    subcategory_id: '4',
    rating: { rate: 4.6, count: 2156 },
    open_hours: [
      { day: 'Monday', from: '09:00', to: '17:00' },
      { day: 'Tuesday', from: '09:00', to: '17:00' },
      { day: 'Wednesday', from: '09:00', to: '17:00' },
      { day: 'Thursday', from: '09:00', to: '17:00' },
      { day: 'Friday', from: '09:00', to: '17:00' },
      { day: 'Saturday', from: '09:00', to: '17:00' },
      { day: 'Sunday', from: '09:00', to: '17:00' },
    ],
    features: [
      { label: 'Museum', icon: 'Building' },
      { label: 'Gardens', icon: 'TreePine' },
      { label: 'Monument', icon: 'Landmark' },
    ],
    services: [
      { label: 'Guided Tours', icon: 'Users' },
      { label: 'Gift Shop', icon: 'ShoppingBag' },
    ],
    tags: ['historical', 'educational', 'tourism', 'cultural'],
    accessibility: [{ label: 'Wheelchair Access', icon: 'Accessibility' }],
    created_at: new Date(),
    updated_at: new Date(),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '4',
    name: 'Accra Mall',
    slug: 'accra-mall',
    tagline: 'Premier shopping destination in Accra',
    description:
      'Modern shopping mall featuring international brands, dining options, and entertainment.',
    contacts: ['+233-302-817-764'],
    email: 'info@accramall.com',
    icon: 'ShoppingBag',
    main_image: '/images/places/accra-mall-main.jpg',
    country_id: 'gh',
    region_id: 'greater-accra',
    city_id: 'accra',
    location: {
      lng: -0.1716,
      lat: 5.6037,
      name: 'Tetteh Quarshie',
      street_address: 'Tetteh Quarshie Interchange, Accra',
    },
    website: 'https://accramall.com',
    category_id: '4',
    subcategory_id: '5',
    rating: { rate: 4.3, count: 3245 },
    open_hours: [
      { day: 'Monday', from: '10:00', to: '22:00' },
      { day: 'Tuesday', from: '10:00', to: '22:00' },
      { day: 'Wednesday', from: '10:00', to: '22:00' },
      { day: 'Thursday', from: '10:00', to: '22:00' },
      { day: 'Friday', from: '10:00', to: '22:00' },
      { day: 'Saturday', from: '10:00', to: '22:00' },
      { day: 'Sunday', from: '12:00', to: '21:00' },
    ],
    features: [
      { label: 'Food Court', icon: 'UtensilsCrossed' },
      { label: 'Cinema', icon: 'Film' },
      { label: 'Parking', icon: 'Car' },
      { label: 'ATM', icon: 'CreditCard' },
    ],
    services: [
      { label: 'Security', icon: 'Shield' },
      { label: 'Customer Service', icon: 'Headphones' },
    ],
    tags: ['shopping', 'entertainment', 'family-friendly', 'modern'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'Accessibility' },
      { label: 'Elevator', icon: 'MoveVertical' },
    ],
    created_at: new Date(),
    updated_at: new Date(),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '5',
    name: 'Skybar 25',
    slug: 'skybar-25',
    tagline: 'Rooftop bar with panoramic views of Accra',
    description:
      'Sophisticated rooftop lounge offering craft cocktails and stunning city views.',
    contacts: ['+233-302-987-654'],
    email: 'reservations@skybar25.com',
    icon: 'Wine',
    main_image: '/images/places/skybar-main.jpg',
    country_id: 'gh',
    region_id: 'greater-accra',
    city_id: 'accra',
    location: {
      lng: -0.1963,
      lat: 5.5502,
      name: 'Ridge',
      street_address: 'Kinbu Road, Ridge, Accra',
    },
    website: 'https://skybar25.com',
    category_id: '1',
    subcategory_id: '2',
    rating: { rate: 4.7, count: 1156 },
    open_hours: [
      { day: 'Wednesday', from: '18:00', to: '02:00' },
      { day: 'Thursday', from: '18:00', to: '02:00' },
      { day: 'Friday', from: '18:00', to: '03:00' },
      { day: 'Saturday', from: '18:00', to: '03:00' },
      { day: 'Sunday', from: '16:00', to: '24:00' },
    ],
    features: [
      { label: 'Rooftop', icon: 'Building2' },
      { label: 'City Views', icon: 'Eye' },
      { label: 'Live DJ', icon: 'Music' },
      { label: 'Cocktails', icon: 'Wine' },
    ],
    services: [
      { label: 'VIP Tables', icon: 'Crown' },
      { label: 'Private Events', icon: 'Calendar' },
    ],
    tags: ['nightlife', 'cocktails', 'rooftop', 'luxury', 'views'],
    created_at: new Date(),
    updated_at: new Date(),
    added_by: 'admin',
    status: 'approved',
  },
];

// Function to generate more mock places for pagination testing
export const generateMockPlaces = (
  count: number,
  startId: number = 6
): Place[] => {
  const places: Place[] = [];
  const baseNames = [
    'Golden Tulip',
    'Afia Beach',
    'Chez Clarisse',
    'La Villa Boutique',
    'Coco Lounge',
    'Terra Nova',
    'Movenpick Ambassador',
    'Tang Palace',
    'Republic Bar',
    'Dynasty Chinese',
    'Santoku',
    'Chop Bar Plus',
    "Rhapsody's",
    "Ike's Cafe",
    'Papaye Restaurant',
    'KFC Ghana',
    'Burger King',
    'Pizza Hut',
    'Cold Stone Creamery',
    'Marwako',
    'National Museum',
    'Independence Arch',
    'Black Star Square',
    'W.E.B. Du Bois Centre',
    'Arts Centre',
    'Manhyia Palace',
    'Cape Coast Castle',
    'Elmina Castle',
  ];

  // Sample images for different categories
  const sampleImages = {
    restaurants: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
    ],
    hotels: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
    ],
    attractions: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73146?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    ],
    shopping: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555529669-2269763671c5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400&h=300&fit=crop',
    ],
  };

  for (let i = 0; i < count; i++) {
    const id = (startId + i).toString();
    const name = baseNames[i % baseNames.length];
    const category =
      mockCategories[Math.floor(Math.random() * mockCategories.length)];

    // Get category-appropriate image
    const categoryImages =
      sampleImages[category.slug as keyof typeof sampleImages] ||
      sampleImages.restaurants;
    const randomImage =
      categoryImages[Math.floor(Math.random() * categoryImages.length)];

    places.push({
      id,
      name: `${name} ${Math.floor(Math.random() * 99) + 1}`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}`,
      tagline: `Amazing ${category.name.toLowerCase()} experience in Ghana`,
      description: `Discover the best ${category.name.toLowerCase()} experience in this wonderful location.`,
      contacts: [`+233-302-${Math.floor(Math.random() * 900000) + 100000}`],
      email: `info@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      icon: category.icon,
      main_image: randomImage,
      country_id: 'gh',
      region_id: 'greater-accra',
      city_id: 'accra',
      location: {
        lng: -0.2 + Math.random() * 0.1,
        lat: 5.5 + Math.random() * 0.1,
        name: `Area ${i + 1}`,
        street_address: `Street ${i + 1}, Accra`,
      },
      category_id: category.id,
      subcategory_id:
        mockSubcategories.find((s) => s.category_id === category.id)?.id || '1',
      rating: {
        rate: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        count: Math.floor(Math.random() * 2000) + 100,
      },
      open_hours: [
        { day: 'Monday', from: '09:00', to: '18:00' },
        { day: 'Tuesday', from: '09:00', to: '18:00' },
        { day: 'Wednesday', from: '09:00', to: '18:00' },
        { day: 'Thursday', from: '09:00', to: '18:00' },
        { day: 'Friday', from: '09:00', to: '18:00' },
        { day: 'Saturday', from: '10:00', to: '20:00' },
        { day: 'Sunday', from: '10:00', to: '18:00' },
      ],
      features: [
        { label: 'WiFi', icon: 'Wifi' },
        { label: 'Parking', icon: 'Car' },
      ],
      tags: ['popular', 'recommended'],
      created_at: new Date(),
      updated_at: new Date(),
      added_by: 'system',
      status: 'approved',
    });
  }

  return places;
};

export const mockChatPlaces: PlaceResultsSummary[] = [
  {
    id: '1',
    name: 'Labadi Beach Hotel',
    slug: 'labadi-beach-hotel',
    tagline: 'Luxury beachfront experience',
    description:
      'A beautiful 5-star hotel right on the beach with stunning ocean views, luxury amenities, and world-class service.',
    main_image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop',
    ],
    country: { name: 'Ghana' },
    region: { name: 'Greater Accra' },
    city: { name: 'Accra' },
    location: {
      lng: -0.187,
      lat: 5.556,
      name: 'Labadi Beach',
      street_address: 'Labadi Beach Road, Accra',
    },
    category: { name: 'Hotels & Accommodation', icon: 'bed' },
    subcategory: { name: 'Beach Resort', icon: 'umbrella-beach' },
    type: { name: 'Resort Hotel' },
    ownership: { type: 'Private' },
    rate_average: 4.5,
    rate_count: 324,
    rate_label: 'highly_rated',
    price_level: 4,
    price_level_count: 85,
    price_level_label: 'expensive',
    distance: 1200,
    open_now: true,
    features: [
      { label: 'Free WiFi', icon: 'wifi' },
      { label: 'Pool', icon: 'swimming-pool' },
      { label: 'Beach Access', icon: 'umbrella-beach' },
    ],
    services: [
      { label: 'Room Service', icon: 'room-service' },
      { label: 'Spa', icon: 'spa' },
      { label: 'Restaurant', icon: 'utensils' },
    ],
    tags: ['luxury', 'beachfront', 'family-friendly'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'wheelchair' },
      { label: 'Elevator', icon: 'elevator' },
    ],
    source: 'placia',
  },
  {
    id: '2',
    name: 'Osu Castle',
    slug: 'osu-castle',
    tagline: 'Historic Danish fortress',
    description:
      'A historic castle built by the Danish in the 17th century, now serving as a museum and cultural site.',
    main_image:
      'https://images.unsplash.com/photo-1585262646203-b5e5e2e95bcf?w=400&h=300&fit=crop',
    country: { name: 'Ghana' },
    region: { name: 'Greater Accra' },
    city: { name: 'Accra' },
    location: {
      lng: -0.178,
      lat: 5.548,
      name: 'Osu',
      street_address: 'Castle Road, Osu, Accra',
    },
    category: { name: 'Attractions & Landmarks', icon: 'landmark' },
    subcategory: { name: 'Historical Sites', icon: 'castle' },
    type: { name: 'Museum' },
    ownership: { type: 'Government' },
    rate_average: 4.2,
    rate_count: 156,
    rate_label: 'well_rated',
    price_level: 1,
    price_level_count: 42,
    price_level_label: 'budget_friendly',
    distance: 800,
    open_now: true,
    features: [
      { label: 'Guided Tours', icon: 'users' },
      { label: 'Photography', icon: 'camera' },
      { label: 'Historical Exhibits', icon: 'book' },
    ],
    services: [
      { label: 'Tour Guide', icon: 'user-check' },
      { label: 'Gift Shop', icon: 'shopping-bag' },
    ],
    tags: ['historic', 'cultural', 'educational'],
    accessibility: [{ label: 'Parking', icon: 'car' }],
    source: 'placia',
  },
  {
    id: '3',
    name: 'Makola Market',
    slug: 'makola-market',
    tagline: 'Vibrant local market experience',
    description:
      "One of Accra's largest and most vibrant markets, perfect for experiencing local culture and finding unique items.",
    main_image:
      'https://images.unsplash.com/photo-1556909045-f2c3123a0a2e?w=400&h=300&fit=crop',
    country: { name: 'Ghana' },
    region: { name: 'Greater Accra' },
    city: { name: 'Accra' },
    location: {
      lng: -0.207,
      lat: 5.556,
      name: 'Central Accra',
      street_address: 'Makola Street, Central Accra',
    },
    category: { name: 'Shopping', icon: 'shopping-bag' },
    subcategory: { name: 'Traditional Markets', icon: 'store' },
    type: { name: 'Local Market' },
    ownership: { type: 'Community' },
    rate_average: 3.8,
    rate_count: 203,
    rate_label: 'well_rated',
    price_level: 1,
    price_level_count: 98,
    price_level_label: 'budget_friendly',
    distance: 2100,
    open_now: true,
    features: [
      { label: 'Local Crafts', icon: 'palette' },
      { label: 'Fresh Produce', icon: 'apple' },
      { label: 'Textiles', icon: 'shirt' },
    ],
    services: [
      { label: 'Local Guides', icon: 'user-check' },
      { label: 'Currency Exchange', icon: 'banknote' },
    ],
    tags: ['local', 'authentic', 'shopping', 'cultural'],
    accessibility: [{ label: 'Public Transport', icon: 'bus' }],
    source: 'google',
  },
];

export const mockChatMessages = [
  {
    id: '1',
    type: 'user' as const,
    content: 'Show me the best hotels near Labadi Beach',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: '2',
    type: 'bot' as const,
    content:
      'I found 3 excellent hotels near Labadi Beach. Here are the top recommendations based on your location and preferences:',
    timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    searchResults: mockChatPlaces,
    metadata: {
      count: 3,
      executionTime: 245,
      searchQuery: 'hotels near Labadi Beach',
      filters: ['beachfront', 'high-rating'],
    },
  },
  {
    id: '3',
    type: 'user' as const,
    content: 'What about something more budget-friendly?',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
  },
  {
    id: '4',
    type: 'bot' as const,
    content: 'Here are some great budget-friendly options near the beach area:',
    timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    searchResults: mockChatPlaces.filter(
      (p) => p.price_level && p.price_level <= 2
    ),
    metadata: {
      count: 2,
      executionTime: 180,
      searchQuery: 'budget hotels near Labadi Beach',
      filters: ['budget', 'good-rating'],
    },
  },
];

interface ConversationAnalysis {
  is_followup: boolean;
  followup_type: string;
  confidence: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address: string | null;
}

interface MessageMetadata {
  // Search-related fields
  count?: number;
  executionTime?: number;
  searchQuery?: string;
  filters?: string[];
  hasMore?: boolean;
  allResults?: PlaceResultsSummary[];
  conversationAnalysis?: ConversationAnalysis;

  // Location-related fields
  show_user_location?: boolean;
  userLocation?: UserLocation;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  searchResults?: PlaceResultsSummary[];
  metadata?: MessageMetadata;
}
