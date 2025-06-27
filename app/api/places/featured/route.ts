import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: places, error } = await supabase
      .from('places')
      .select(
        `
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        ownership:ownership_id(id, type, slug, icon),
        country:country_id(id, name),
        region:region_id(id, name),
        city:city_id(id, name)
      `
      )
      .eq('isFeatured', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(12); // Limit to 12 featured places

    if (error) {
      console.error('Error fetching featured places:', error);
      return NextResponse.json(
        { error: 'Failed to fetch featured places' },
        { status: 500 }
      );
    }

    // Transform the data to match our Place interface
    const transformedPlaces = places.map((place) => ({
      id: place.id,
      name: place.name,
      slug: place.slug,
      tagline: place.tagline,
      description: place.description,
      contacts: place.contacts || [],
      email: place.email,
      logo: place.logo,
      main_image: place.main_image || place.gallery?.[0] || '',
      gallery: place.gallery || [],

      country_id: place.country_id,
      region_id: place.region_id,
      city_id: place.city_id,
      town_id: place.town_id,
      location: place.location,

      website: place.website,
      socials: place.socials || [],

      category_id: place.category_id,
      subcategory_id: place.subcategory_id,
      type_id: place.type_id,
      ownership_id: place.ownership_id,

      rate_average: place.rate_average,
      rate_count: place.rate_count,
      open_hours: place.open_hours || [],
      features: place.features || [],
      services: place.services || [],
      tags: place.tags || [],
      accessibility: place.accessibility || [],

      other_details: place.other_details,
      source: place.source,
      source_link: place.source_link,

      added_by: place.added_by,
      status: place.status,
      isBusinessPlace: place.isBusinessPlace || false,
      isFeatured: place.isFeatured || false,

      created_at: place.created_at,
      updated_at: place.updated_at,

      // Add the related data
      category: place.category,
      subcategory: place.subcategory,
      type: place.type,
      ownership: place.ownership,
      country: place.country,
      region: place.region,
      city: place.city,
    }));

    return NextResponse.json(transformedPlaces);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
