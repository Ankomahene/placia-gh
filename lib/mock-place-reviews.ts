import { PlaceReview } from '@/types/place';

// Create mock reviews for places
export const mockPlaceReviews: Record<string, PlaceReview[]> = {
  'labadi-beach-hotel': [
    {
      id: '1',
      place_id: '1',
      user_id: 'user1',
      user_name: 'John Doe',
      user_avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      rating: 5,
      content: 'Absolutely amazing experience! The staff was incredibly attentive and the facilities are world-class. The beach access is a huge plus, and the pool area is stunning. Rooms are spacious and luxurious with great ocean views. Will definitely be coming back!',
      likes: 24,
      created_at: new Date('2023-08-15'),
      updated_at: new Date('2023-08-15')
    },
    {
      id: '2',
      place_id: '1',
      user_id: 'user2',
      user_name: 'Sarah Johnson',
      user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      rating: 4,
      content: 'Great hotel with excellent amenities. The rooms are clean and comfortable, and the staff is friendly. The only downside was that the restaurant was a bit pricey, but the food quality was good. The beach access is wonderful and the pool area is very nice.',
      likes: 15,
      created_at: new Date('2023-09-02'),
      updated_at: new Date('2023-09-02')
    },
    {
      id: '3',
      place_id: '1',
      user_id: 'user3',
      user_name: 'Michael Brown',
      user_avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
      rating: 5,
      content: 'One of the best hotels in Accra! The location is perfect, right on the beach with beautiful views. The rooms are spacious and well-appointed, and the service is impeccable. The breakfast buffet offers a wide variety of options, and the pool area is fantastic. Highly recommended for both business and leisure travelers.',
      likes: 32,
      created_at: new Date('2023-10-10'),
      updated_at: new Date('2023-10-10')
    },
    {
      id: '4',
      place_id: '1',
      user_id: 'user4',
      user_name: 'Emily Wilson',
      user_avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      rating: 3,
      content: 'The hotel has a great location and nice facilities, but I found the service to be inconsistent. Some staff members were very helpful, while others seemed disinterested. The room was clean but showing some signs of wear. The food at the restaurant was good but overpriced for what you get.',
      likes: 7,
      created_at: new Date('2023-11-05'),
      updated_at: new Date('2023-11-05')
    },
    {
      id: '5',
      place_id: '1',
      user_id: 'user5',
      user_name: 'David Chen',
      user_avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      rating: 5,
      content: 'Exceptional luxury hotel! From the moment we arrived, we were treated like royalty. The room was spacious and beautifully decorated with a stunning ocean view. The private beach access is a huge plus, and the pool area is immaculate. All the restaurants serve delicious food with great variety. Worth every penny for a special occasion or luxury getaway.',
      likes: 41,
      created_at: new Date('2023-12-18'),
      updated_at: new Date('2023-12-18')
    }
  ],
  'buka-restaurant': [
    {
      id: '1',
      place_id: '2',
      user_id: 'user1',
      user_name: 'Kwame Mensah',
      user_avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
      rating: 5,
      content: 'Authentic Ghanaian food at its best! The fufu with light soup was perfect, and the jollof rice was flavorful and well-spiced. The service was friendly and efficient. Will definitely be coming back to try more dishes!',
      likes: 18,
      created_at: new Date('2023-07-20'),
      updated_at: new Date('2023-07-20')
    },
    {
      id: '2',
      place_id: '2',
      user_id: 'user2',
      user_name: 'Lisa Thompson',
      user_avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg',
      rating: 4,
      content: 'Great food and atmosphere! I tried the banku with okra soup and it was delicious. The portions are generous and the prices are reasonable. The only reason I\'m not giving 5 stars is because the service was a bit slow during peak hours. Otherwise, highly recommended for authentic Ghanaian cuisine.',
      likes: 12,
      created_at: new Date('2023-08-05'),
      updated_at: new Date('2023-08-05')
    },
    {
      id: '3',
      place_id: '2',
      user_id: 'user3',
      user_name: 'Daniel Osei',
      user_avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      rating: 5,
      content: 'As a Ghanaian, I can confirm this is the real deal! The flavors are authentic and remind me of my grandmother\'s cooking. The waakye is exceptional, and the kelewele is perfectly spiced. The restaurant has a nice ambiance with traditional elements mixed with modern decor. Prices are fair for the quality and quantity you get.',
      likes: 29,
      created_at: new Date('2023-09-12'),
      updated_at: new Date('2023-09-12')
    },
    {
      id: '4',
      place_id: '2',
      user_id: 'user4',
      user_name: 'Rachel Adams',
      user_avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      rating: 3,
      content: 'The food was good but not exceptional. I found some dishes to be too spicy without warning, and others a bit bland. The atmosphere is nice, and the staff is friendly. It\'s worth a visit if you're in the area, but I wouldn\'t go out of my way for it.',
      likes: 5,
      created_at: new Date('2023-10-30'),
      updated_at: new Date('2023-10-30')
    }
  ],
  'kwame-nkrumah-memorial-park': [
    {
      id: '1',
      place_id: '3',
      user_id: 'user1',
      user_name: 'James Wilson',
      user_avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      rating: 5,
      content: 'A must-visit historical site in Accra! The memorial is beautifully maintained and offers great insights into Ghana\'s independence and Dr. Nkrumah\'s legacy. The museum has interesting artifacts and information panels that tell the story of Ghana\'s struggle for independence. The grounds are peaceful and well-kept, making it a pleasant place to spend a couple of hours.',
      likes: 31,
      created_at: new Date('2023-06-10'),
      updated_at: new Date('2023-06-10')
    },
    {
      id: '2',
      place_id: '3',
      user_id: 'user2',
      user_name: 'Olivia Parker',
      user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      rating: 4,
      content: 'Very educational and important historical site. The mausoleum is impressive and the museum provides good context about Ghana\'s independence and Dr. Nkrumah\'s role. The guided tour is worth taking as it adds a lot of context. My only suggestion would be to update some of the exhibits as they\'re showing their age.',
      likes: 14,
      created_at: new Date('2023-07-22'),
      updated_at: new Date('2023-07-22')
    },
    {
      id: '3',
      place_id: '3',
      user_id: 'user3',
      user_name: 'Robert Johnson',
      user_avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
      rating: 5,
      content: 'An essential visit for anyone interested in African history and independence movements. The memorial is beautifully designed and the museum offers a comprehensive look at Dr. Nkrumah\'s life and legacy. The peaceful grounds with fountains provide a nice contrast to the busy city outside. Highly recommended for both tourists and locals.',
      likes: 27,
      created_at: new Date('2023-08-15'),
      updated_at: new Date('2023-08-15')
    }
  ],
  'accra-mall': [
    {
      id: '1',
      place_id: '4',
      user_id: 'user1',
      user_name: 'Sophia Addo',
      user_avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      rating: 4,
      content: 'Great shopping experience with a wide variety of stores. The mall is clean and well-maintained with good security. The food court offers decent options when you need a break from shopping. It can get quite crowded on weekends, so weekday visits are more relaxed. Parking can also be challenging during peak hours.',
      likes: 19,
      created_at: new Date('2023-09-05'),
      updated_at: new Date('2023-09-05')
    },
    {
      id: '2',
      place_id: '4',
      user_id: 'user2',
      user_name: 'Thomas Grant',
      user_avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      rating: 5,
      content: 'The best mall in Accra! It has everything you need - from fashion and electronics to groceries and entertainment. The cinema shows the latest movies, and the food court has a good selection of local and international cuisine. The mall is always clean and the air conditioning is a welcome relief from the Accra heat. Highly recommended for a day of shopping and entertainment.',
      likes: 24,
      created_at: new Date('2023-10-12'),
      updated_at: new Date('2023-10-12')
    },
    {
      id: '3',
      place_id: '4',
      user_id: 'user3',
      user_name: 'Ama Serwaa',
      user_avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg',
      rating: 3,
      content: 'It\'s a decent mall but nothing exceptional. The stores are okay but many international brands are missing. The food court is average with limited options. It gets very crowded on weekends and holidays, making it difficult to shop comfortably. Parking can be a nightmare during peak hours. It\'s convenient if you\'re in the area, but I wouldn\'t make a special trip.',
      likes: 8,
      created_at: new Date('2023-11-20'),
      updated_at: new Date('2023-11-20')
    },
    {
      id: '4',
      place_id: '4',
      user_id: 'user4',
      user_name: 'Benjamin Owusu',
      user_avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      rating: 4,
      content: 'A good shopping destination in Accra. The mall has a nice selection of stores, though prices tend to be on the higher side. The supermarket is well-stocked with both local and imported products. The cinema shows the latest movies, which is great for entertainment. The mall is generally clean and well-maintained, though it can get very busy during weekends and holidays.',
      likes: 15,
      created_at: new Date('2023-12-05'),
      updated_at: new Date('2023-12-05')
    }
  ],
  'skybar-25': [
    {
      id: '1',
      place_id: '5',
      user_id: 'user1',
      user_name: 'Jessica Miller',
      user_avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg',
      rating: 5,
      content: 'Absolutely stunning rooftop bar with breathtaking views of Accra! The cocktails are expertly crafted and delicious, though a bit pricey. The ambiance is sophisticated and perfect for a special night out. We went during sunset and the views were spectacular. The staff is attentive and knowledgeable about their drinks. Definitely make a reservation, especially on weekends.',
      likes: 37,
      created_at: new Date('2023-08-18'),
      updated_at: new Date('2023-08-18')
    },
    {
      id: '2',
      place_id: '5',
      user_id: 'user2',
      user_name: 'Alex Thompson',
      user_avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      rating: 4,
      content: 'Great spot for drinks with a view! The cocktails are creative and well-made, though they come with a premium price tag. The atmosphere is upscale and trendy, perfect for a date night or special occasion. The DJ plays good music that sets the right mood without being too loud for conversation. Service can be slow when it\'s busy, but the staff is friendly.',
      likes: 21,
      created_at: new Date('2023-09-25'),
      updated_at: new Date('2023-09-25')
    },
    {
      id: '3',
      place_id: '5',
      user_id: 'user3',
      user_name: 'Nana Ama',
      user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      rating: 5,
      content: 'The best rooftop bar in Accra, hands down! The views of the city are unmatched, especially at sunset. The drinks menu is innovative with both classic cocktails and unique creations using local ingredients. The small plates menu is perfect for sharing. The décor is stylish and creates a luxurious atmosphere. It\'s pricey but worth it for a special night out. Definitely make reservations in advance.',
      likes: 42,
      created_at: new Date('2023-10-30'),
      updated_at: new Date('2023-10-30')
    },
    {
      id: '4',
      place_id: '5',
      user_id: 'user4',
      user_name: 'Daniel Kofi',
      user_avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
      rating: 3,
      content: 'Nice views but overpriced drinks. While the rooftop setting and city views are impressive, I found the drinks to be overpriced for what you get. The service was slow even though it wasn\'t particularly busy when we visited. The music was good and the atmosphere is upscale, but I\'m not sure it justifies the premium prices. It\'s worth visiting once for the experience, but there are better value options in Accra.',
      likes: 9,
      created_at: new Date('2023-11-15'),
      updated_at: new Date('2023-11-15')
    }
  ]
};