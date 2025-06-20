import { PlaceResults } from '@/types/place';

// Create a comprehensive mock data set for place details
export const mockPlaceDetails: PlaceResults[] = [
  {
    id: '1',
    name: 'Labadi Beach Hotel',
    slug: 'labadi-beach-hotel',
    tagline: 'Luxury beachfront resort in Accra',
    description: 'A premier beachfront hotel offering world-class amenities and stunning ocean views. Located on the beautiful Labadi Beach, this 5-star hotel provides luxurious accommodations, exceptional dining options, and a wide range of recreational facilities. Perfect for both business and leisure travelers seeking a premium experience in Accra.',
    contacts: ['+233-302-772-501', '+233-302-772-502'],
    email: 'info@labadibeach.com',
    icon: 'Hotel',
    logo: 'https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    main_image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    country: { id: 'gh', name: 'Ghana', emoji: '🇬🇭' },
    region: { id: 'greater-accra', name: 'Greater Accra' },
    city: { id: 'accra', name: 'Accra' },
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
      { platform_name: 'twitter', link: 'https://twitter.com/labadibeach' }
    ],
    category: {
      id: '2',
      name: 'Hotels & Accommodation',
      slug: 'hotels',
      icon: 'Hotel'
    },
    subcategory: {
      id: '3',
      name: 'Luxury Hotels',
      slug: 'luxury-hotels',
      icon: 'Crown'
    },
    type: {
      id: 'luxury-hotel',
      name: 'Resort Hotel',
      slug: 'resort-hotel',
      icon: 'Hotel'
    },
    ownership: {
      id: 'private',
      type: 'Private',
      slug: 'private',
      icon: 'Building'
    },
    rating: { rate: 4.5, count: 1248 },
    rate_average: 4.5,
    rate_count: 1248,
    rate_label: 'highly_rated',
    price_level: 4,
    price_level_label: 'very_expensive',
    open_now: true,
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
      { label: 'Swimming Pool', icon: 'Swimming' },
      { label: 'Spa & Wellness', icon: 'Spa' },
      { label: 'Restaurant', icon: 'UtensilsCrossed' },
      { label: 'Free WiFi', icon: 'Wifi' },
      { label: 'Air Conditioning', icon: 'Wind' },
      { label: 'Conference Rooms', icon: 'Users' },
      { label: 'Fitness Center', icon: 'Dumbbell' }
    ],
    services: [
      { label: 'Room Service', icon: 'ConciergeBell' },
      { label: 'Laundry', icon: 'Shirt' },
      { label: 'Airport Shuttle', icon: 'Car' },
      { label: 'Concierge', icon: 'User' },
      { label: 'Currency Exchange', icon: 'DollarSign' }
    ],
    tags: ['luxury', 'beach', 'business', 'family-friendly', 'spa', 'swimming-pool', 'restaurant', 'bar'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'Accessibility' },
      { label: 'Elevator', icon: 'MoveVertical' },
      { label: 'Accessible Bathroom', icon: 'Bath' }
    ],
    created_at: new Date('2023-01-15'),
    updated_at: new Date('2023-06-20'),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '2',
    name: 'Buka Restaurant',
    slug: 'buka-restaurant',
    tagline: 'Authentic Ghanaian cuisine in the heart of Osu',
    description: 'Experience the best of Ghanaian traditional dishes in a modern, vibrant setting. Buka Restaurant offers a wide range of local and continental dishes prepared with the freshest ingredients. Our chefs combine traditional cooking methods with modern presentation to create a unique dining experience. Whether you\'re craving fufu with light soup, jollof rice, or grilled tilapia, we have something to satisfy your appetite.',
    contacts: ['+233-302-123-456'],
    email: 'info@bukarestaurant.com',
    icon: 'UtensilsCrossed',
    logo: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    main_image: 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    country: { id: 'gh', name: 'Ghana', emoji: '🇬🇭' },
    region: { id: 'greater-accra', name: 'Greater Accra' },
    city: { id: 'accra', name: 'Accra' },
    location: {
      lng: -0.1870,
      lat: 5.5636,
      name: 'Osu',
      street_address: 'Oxford Street, Osu, Accra',
    },
    website: 'https://bukarestaurant.com',
    socials: [
      { platform_name: 'instagram', link: 'https://instagram.com/bukarestaurant' },
      { platform_name: 'facebook', link: 'https://facebook.com/bukarestaurant' }
    ],
    category: {
      id: '1',
      name: 'Restaurants & Food',
      slug: 'restaurants',
      icon: 'UtensilsCrossed'
    },
    subcategory: {
      id: '1',
      name: 'Local Cuisine',
      slug: 'local-cuisine',
      icon: 'ChefHat'
    },
    rating: { rate: 4.2, count: 892 },
    rate_average: 4.2,
    rate_count: 892,
    rate_label: 'well_rated',
    price_level: 2,
    price_level_label: 'moderate',
    open_now: true,
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
      { label: 'Reservations', icon: 'Calendar' },
      { label: 'Vegetarian Options', icon: 'Leaf' }
    ],
    services: [
      { label: 'Takeaway', icon: 'ShoppingBag' },
      { label: 'Delivery', icon: 'Truck' },
      { label: 'Catering', icon: 'UtensilsCrossed' }
    ],
    tags: ['local-cuisine', 'traditional', 'family-friendly', 'group-dining', 'outdoor-seating'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'Accessibility' }
    ],
    created_at: new Date('2023-02-10'),
    updated_at: new Date('2023-07-15'),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '3',
    name: 'Kwame Nkrumah Memorial Park',
    slug: 'kwame-nkrumah-memorial-park',
    tagline: "Historic memorial dedicated to Ghana's first president",
    description: 'A beautiful park and mausoleum dedicated to Dr. Kwame Nkrumah, the first President of Ghana and a prominent Pan-Africanist. The park features a museum with artifacts related to Ghana\'s independence, the mausoleum where Dr. Nkrumah and his wife are buried, and beautiful grounds with fountains and statues. It\'s a must-visit destination for anyone interested in Ghana\'s history and the story of African independence movements.',
    contacts: ['+233-302-666-751'],
    email: 'info@knmemorialpark.gov.gh',
    icon: 'Landmark',
    main_image: 'https://images.pexels.com/photos/4350631/pexels-photo-4350631.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/4350631/pexels-photo-4350631.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/5059103/pexels-photo-5059103.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/5059141/pexels-photo-5059141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    country: { id: 'gh', name: 'Ghana', emoji: '🇬🇭' },
    region: { id: 'greater-accra', name: 'Greater Accra' },
    city: { id: 'accra', name: 'Accra' },
    location: {
      lng: -0.2218,
      lat: 5.5502,
      name: 'High Street',
      street_address: 'High Street, Accra',
    },
    website: 'https://knmemorialpark.gov.gh',
    socials: [
      { platform_name: 'facebook', link: 'https://facebook.com/knmemorialpark' },
      { platform_name: 'instagram', link: 'https://instagram.com/knmemorialpark' }
    ],
    category: {
      id: '3',
      name: 'Attractions & Landmarks',
      slug: 'attractions',
      icon: 'Landmark'
    },
    subcategory: {
      id: '4',
      name: 'Historical Sites',
      slug: 'historical-sites',
      icon: 'Landmark'
    },
    rating: { rate: 4.6, count: 2156 },
    rate_average: 4.6,
    rate_count: 2156,
    rate_label: 'highly_rated',
    price_level: 1,
    price_level_label: 'budget_friendly',
    open_now: true,
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
      { label: 'Guided Tours', icon: 'Users' }
    ],
    services: [
      { label: 'Guided Tours', icon: 'Users' },
      { label: 'Gift Shop', icon: 'ShoppingBag' },
      { label: 'Educational Programs', icon: 'GraduationCap' }
    ],
    tags: ['historical', 'educational', 'tourism', 'cultural', 'monument', 'museum'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'Accessibility' },
      { label: 'Accessible Parking', icon: 'Car' }
    ],
    created_at: new Date('2023-03-05'),
    updated_at: new Date('2023-08-10'),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '4',
    name: 'Accra Mall',
    slug: 'accra-mall',
    tagline: 'Premier shopping destination in Accra',
    description: 'Modern shopping mall featuring international brands, dining options, and entertainment. Accra Mall is the first large-scale shopping center in Ghana and offers a wide range of retail stores, from fashion and electronics to groceries and home goods. The mall also features a food court with various dining options, a cinema, and regular events and promotions. It\'s a popular destination for both locals and tourists looking for a modern shopping experience in Accra.',
    contacts: ['+233-302-817-764'],
    email: 'info@accramall.com',
    icon: 'ShoppingBag',
    logo: 'https://images.pexels.com/photos/1050244/pexels-photo-1050244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    main_image: 'https://images.pexels.com/photos/1050244/pexels-photo-1050244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/1050244/pexels-photo-1050244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1243939/pexels-photo-1243939.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    country: { id: 'gh', name: 'Ghana', emoji: '🇬🇭' },
    region: { id: 'greater-accra', name: 'Greater Accra' },
    city: { id: 'accra', name: 'Accra' },
    location: {
      lng: -0.1716,
      lat: 5.6037,
      name: 'Tetteh Quarshie',
      street_address: 'Tetteh Quarshie Interchange, Accra',
    },
    website: 'https://accramall.com',
    socials: [
      { platform_name: 'facebook', link: 'https://facebook.com/accramall' },
      { platform_name: 'instagram', link: 'https://instagram.com/accramall' },
      { platform_name: 'twitter', link: 'https://twitter.com/accramall' }
    ],
    category: {
      id: '4',
      name: 'Shopping',
      slug: 'shopping',
      icon: 'ShoppingBag'
    },
    subcategory: {
      id: '5',
      name: 'Shopping Centers',
      slug: 'shopping-centers',
      icon: 'Building'
    },
    rating: { rate: 4.3, count: 3245 },
    rate_average: 4.3,
    rate_count: 3245,
    rate_label: 'well_rated',
    price_level: 3,
    price_level_label: 'expensive',
    open_now: true,
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
      { label: 'Free WiFi', icon: 'Wifi' },
      { label: 'Air Conditioning', icon: 'Wind' }
    ],
    services: [
      { label: 'Security', icon: 'Shield' },
      { label: 'Customer Service', icon: 'Headphones' },
      { label: 'Gift Wrapping', icon: 'Gift' },
      { label: 'Lost & Found', icon: 'Search' }
    ],
    tags: ['shopping', 'entertainment', 'family-friendly', 'modern', 'food-court', 'cinema'],
    accessibility: [
      { label: 'Wheelchair Access', icon: 'Accessibility' },
      { label: 'Elevator', icon: 'MoveVertical' },
      { label: 'Accessible Parking', icon: 'Car' },
      { label: 'Accessible Restrooms', icon: 'Bath' }
    ],
    created_at: new Date('2023-01-20'),
    updated_at: new Date('2023-09-05'),
    added_by: 'admin',
    status: 'approved',
  },
  {
    id: '5',
    name: 'Skybar 25',
    slug: 'skybar-25',
    tagline: 'Rooftop bar with panoramic views of Accra',
    description: 'Sophisticated rooftop lounge offering craft cocktails and stunning city views. Perched high above the bustling streets of Accra, Skybar 25 provides a luxurious escape with panoramic views of the city skyline. Our expert mixologists craft signature cocktails using premium spirits and fresh ingredients, while our kitchen serves a selection of gourmet small plates perfect for sharing. With stylish décor, ambient lighting, and regular DJ performances, Skybar 25 is the ideal venue for a romantic evening, celebration, or night out with friends.',
    contacts: ['+233-302-987-654'],
    email: 'reservations@skybar25.com',
    icon: 'Wine',
    logo: 'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    main_image: 'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    country: { id: 'gh', name: 'Ghana', emoji: '🇬🇭' },
    region: { id: 'greater-accra', name: 'Greater Accra' },
    city: { id: 'accra', name: 'Accra' },
    location: {
      lng: -0.1963,
      lat: 5.5502,
      name: 'Ridge',
      street_address: 'Kinbu Road, Ridge, Accra',
    },
    website: 'https://skybar25.com',
    socials: [
      { platform_name: 'instagram', link: 'https://instagram.com/skybar25' },
      { platform_name: 'facebook', link: 'https://facebook.com/skybar25' },
      { platform_name: 'twitter', link: 'https://twitter.com/skybar25' }
    ],
    category: {
      id: '1',
      name: 'Restaurants & Food',
      slug: 'restaurants',
      icon: 'UtensilsCrossed'
    },
    subcategory: {
      id: '2',
      name: 'Bars & Nightlife',
      slug: 'bars-nightlife',
      icon: 'Wine'
    },
    rating: { rate: 4.7, count: 1156 },
    rate_average: 4.7,
    rate_count: 1156,
    rate_label: 'highly_rated',
    price_level: 3,
    price_level_label: 'expensive',
    open_now: false,
    open_hours: [
      { day: 'Monday', from: 'closed', to: 'closed' },
      { day: 'Tuesday', from: 'closed', to: 'closed' },
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
      { label: 'Craft Cocktails', icon: 'Wine' },
      { label: 'Outdoor Seating', icon: 'TreePine' }
    ],
    services: [
      { label: 'VIP Tables', icon: 'Crown' },
      { label: 'Private Events', icon: 'Calendar' },
      { label: 'Bottle Service', icon: 'Wine' },
      { label: 'Valet Parking', icon: 'Car' }
    ],
    tags: ['nightlife', 'cocktails', 'rooftop', 'luxury', 'views', 'date-night', 'music'],
    accessibility: [
      { label: 'Elevator Access', icon: 'MoveVertical' }
    ],
    created_at: new Date('2023-04-12'),
    updated_at: new Date('2023-10-01'),
    added_by: 'admin',
    status: 'approved',
  }
];