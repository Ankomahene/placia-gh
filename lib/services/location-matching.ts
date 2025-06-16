import { createClient } from '@/lib/supabase/client';
import type { Country, Region, City } from '@/types/place';

export interface LocationComponents {
  country?: string;
  region?: string;
  city?: string;
  town?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface MatchedLocation {
  country_id?: string;
  region_id?: string;
  city_id?: string;
  town_id?: string;
  location: {
    lng: number;
    lat: number;
    name: string;
    street_address: string;
  };
  components: LocationComponents;
}

// Geocoding service using Nominatim (free)
export async function geocodeAddress(
  query: string
): Promise<LocationComponents[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
    );

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();

    return data.map((item: any) => ({
      country: item.address?.country,
      region:
        item.address?.state || item.address?.province || item.address?.region,
      city:
        item.address?.city || item.address?.town || item.address?.municipality,
      town:
        item.address?.suburb ||
        item.address?.neighbourhood ||
        item.address?.village,
      address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

// Reverse geocoding service
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationComponents | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );

    if (!response.ok) throw new Error('Reverse geocoding failed');

    const data = await response.json();

    return {
      country: data.address?.country,
      region:
        data.address?.state || data.address?.province || data.address?.region,
      city:
        data.address?.city || data.address?.town || data.address?.municipality,
      town:
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.village,
      address: data.display_name,
      latitude: lat,
      longitude: lng,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Smart word-based matching for location names
function smartLocationMatch(searchTerm: string, dbName: string): number {
  const search = searchTerm.toLowerCase().trim();
  const db = dbName.toLowerCase().trim();

  // Exact match gets highest score
  if (search === db) return 1;

  // Remove common suffixes/prefixes for better matching
  const cleanSearch = search
    .replace(/\b(region|municipality|municipal|district|area)\b/g, '')
    .trim();
  const cleanDb = db
    .replace(/\b(region|municipality|municipal|district|area)\b/g, '')
    .trim();

  // Check if cleaned versions match
  if (cleanSearch === cleanDb) return 0.95;

  // Word-based matching - split into words and check overlap
  const searchWords = cleanSearch
    .split(/\s+/)
    .filter((word) => word.length > 1);
  const dbWords = cleanDb.split(/\s+/).filter((word) => word.length > 1);

  if (searchWords.length === 0 || dbWords.length === 0) return 0;

  // Count matching words
  let matchingWords = 0;
  for (const searchWord of searchWords) {
    for (const dbWord of dbWords) {
      if (
        searchWord === dbWord ||
        searchWord.includes(dbWord) ||
        dbWord.includes(searchWord)
      ) {
        matchingWords++;
        break;
      }
    }
  }

  // Calculate score based on word overlap
  const maxWords = Math.max(searchWords.length, dbWords.length);
  const wordScore = matchingWords / maxWords;

  // Boost score if most words match
  if (wordScore >= 0.7) return 0.9;
  if (wordScore >= 0.5) return 0.7;

  // Fallback to substring matching
  if (cleanSearch.includes(cleanDb) || cleanDb.includes(cleanSearch)) {
    return 0.6;
  }

  return wordScore * 0.5; // Lower score for partial matches
}

// Save unmatched location to existing tables with flag
async function saveUnmatchedLocation(
  type: 'region' | 'city' | 'town',
  name: string,
  components: LocationComponents,
  parentId?: string
) {
  const supabase = createClient();

  try {
    const tableName = `${type}s`; // regions, cities, towns

    // Check if already exists to prevent duplicates
    let existsQuery = supabase
      .from(tableName)
      .select('id')
      .ilike('name', name)
      .eq('is_unmatched', true);

    if (parentId) {
      const parentField =
        type === 'region'
          ? 'country_id'
          : type === 'city'
            ? 'region_id'
            : 'city_id';
      existsQuery = existsQuery.eq(parentField, parentId);
    }

    const { data: existing } = await existsQuery.limit(1);

    if (!existing || existing.length === 0) {
      const insertData: any = {
        name,
        is_unmatched: true,
        source_address: components.address,
        original_search_term: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (parentId) {
        const parentField =
          type === 'region'
            ? 'country_id'
            : type === 'city'
              ? 'region_id'
              : 'city_id';
        insertData[parentField] = parentId;
      }

      // Add location coordinates if available
      if (components.latitude && components.longitude) {
        insertData.latitude = components.latitude;
        insertData.longitude = components.longitude;
      }

      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.warn(`Could not save unmatched ${type}:`, error.message);
      } else {
        return inserted.id; // Return the ID for potential use
      }
    } else {
      return existing[0].id;
    }
  } catch (error) {
    // Silently handle errors to not break the user experience
    console.warn(`Could not save unmatched ${type}:`, error);
  }

  return null;
}

// Match location components to database IDs
export async function matchLocationToDatabase(
  components: LocationComponents
): Promise<MatchedLocation> {
  const supabase = createClient();
  let matchedLocation: MatchedLocation = {
    location: {
      lng: components.longitude,
      lat: components.latitude,
      name: components.city || components.town || 'Unknown Location',
      street_address: components.address || '',
    },
    components,
  };

  try {
    // Match country
    if (components.country) {
      const { data: countries } = await supabase
        .from('countries')
        .select('*')
        .ilike('name', `%${components.country}%`);

      if (countries && countries.length > 0) {
        // Find best match using improved algorithm
        let bestMatch = countries[0];
        let bestScore = smartLocationMatch(
          components.country,
          countries[0].name
        );

        for (const country of countries) {
          const score = smartLocationMatch(components.country, country.name);
          if (score > bestScore) {
            bestMatch = country;
            bestScore = score;
          }
        }

        if (bestScore > 0.5) {
          matchedLocation.country_id = bestMatch.id;

          // Match region within country
          if (components.region) {
            const { data: regions } = await supabase
              .from('regions')
              .select('*')
              .eq('country_id', bestMatch.id);

            let regionMatched = false;

            if (regions && regions.length > 0) {
              let bestRegionMatch = regions[0];
              let bestRegionScore = smartLocationMatch(
                components.region,
                regions[0].name
              );

              for (const region of regions) {
                const score = smartLocationMatch(
                  components.region,
                  region.name
                );
                if (score > bestRegionScore) {
                  bestRegionMatch = region;
                  bestRegionScore = score;
                }
              }

              if (bestRegionScore > 0.4) {
                matchedLocation.region_id = bestRegionMatch.id;
                regionMatched = true;

                // Match city within region
                if (components.city) {
                  const { data: cities } = await supabase
                    .from('cities')
                    .select('*')
                    .eq('region_id', bestRegionMatch.id);

                  let cityMatched = false;

                  if (cities && cities.length > 0) {
                    let bestCityMatch = cities[0];
                    let bestCityScore = smartLocationMatch(
                      components.city,
                      cities[0].name
                    );

                    for (const city of cities) {
                      const score = smartLocationMatch(
                        components.city,
                        city.name
                      );
                      if (score > bestCityScore) {
                        bestCityMatch = city;
                        bestCityScore = score;
                      }
                    }

                    if (bestCityScore > 0.4) {
                      matchedLocation.city_id = bestCityMatch.id;
                      cityMatched = true;

                      // Match town within city (if applicable)
                      if (components.town) {
                        const { data: towns } = await supabase
                          .from('towns')
                          .select('*')
                          .eq('city_id', bestCityMatch.id);

                        if (towns && towns.length > 0) {
                          let bestTownMatch = towns[0];
                          let bestTownScore = smartLocationMatch(
                            components.town,
                            towns[0].name
                          );

                          for (const town of towns) {
                            const score = smartLocationMatch(
                              components.town,
                              town.name
                            );
                            if (score > bestTownScore) {
                              bestTownMatch = town;
                              bestTownScore = score;
                            }
                          }

                          if (bestTownScore > 0.4) {
                            matchedLocation.town_id = bestTownMatch.id;
                          } else {
                            // Save unmatched town for future use and use it
                            const savedTownId = await saveUnmatchedLocation(
                              'town',
                              components.town,
                              components,
                              bestCityMatch.id
                            );
                            if (savedTownId) {
                              matchedLocation.town_id = savedTownId;
                            }
                          }
                        } else if (components.town) {
                          // No towns in database for this city, save for future use and use it
                          const savedTownId = await saveUnmatchedLocation(
                            'town',
                            components.town,
                            components,
                            bestCityMatch.id
                          );
                          if (savedTownId) {
                            matchedLocation.town_id = savedTownId;
                          }
                        }
                      }
                    }
                  }

                  // If city not matched, save for future use and use it
                  if (!cityMatched && components.city) {
                    const savedCityId = await saveUnmatchedLocation(
                      'city',
                      components.city,
                      components,
                      bestRegionMatch.id
                    );
                    if (savedCityId) {
                      matchedLocation.city_id = savedCityId;

                      // Also try to save and use town if available
                      if (components.town) {
                        const savedTownId = await saveUnmatchedLocation(
                          'town',
                          components.town,
                          components,
                          savedCityId
                        );
                        if (savedTownId) {
                          matchedLocation.town_id = savedTownId;
                        }
                      }
                    }
                  }
                }
              }
            }

            // If region not matched, save for future use and use it
            if (!regionMatched && components.region) {
              const savedRegionId = await saveUnmatchedLocation(
                'region',
                components.region,
                components,
                bestMatch.id
              );
              if (savedRegionId) {
                matchedLocation.region_id = savedRegionId;

                // Also try to save and use city/town if available
                if (components.city) {
                  const savedCityId = await saveUnmatchedLocation(
                    'city',
                    components.city,
                    components,
                    savedRegionId
                  );
                  if (savedCityId) {
                    matchedLocation.city_id = savedCityId;

                    if (components.town) {
                      const savedTownId = await saveUnmatchedLocation(
                        'town',
                        components.town,
                        components,
                        savedCityId
                      );
                      if (savedTownId) {
                        matchedLocation.town_id = savedTownId;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Database matching error:', error);
  }

  return matchedLocation;
}
