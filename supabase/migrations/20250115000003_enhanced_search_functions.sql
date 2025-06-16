-- Enhanced search functions with dedicated functions for each search type
-- Drop old functions
DROP FUNCTION IF EXISTS search_top_rated_places(text, numeric, numeric, numeric, numeric, integer);
DROP FUNCTION IF EXISTS places_near_location_with_search(text, numeric, numeric, numeric, numeric, integer);
DROP FUNCTION IF EXISTS search_places_by_rating(text, numeric, numeric, numeric, numeric, numeric, integer);
DROP FUNCTION IF EXISTS search_places_by_price(text, integer, integer, numeric, numeric, numeric, integer);
DROP FUNCTION IF EXISTS search_places_unified(text, numeric, numeric, numeric, numeric, numeric, integer, integer, text, integer);
DROP FUNCTION IF EXISTS search_places_by_proximity(text, numeric, numeric, numeric, numeric, numeric, integer, integer, text, integer, integer);
DROP FUNCTION IF EXISTS search_places_by_rating(text, numeric, numeric, numeric, numeric, numeric, text, integer, integer);
DROP FUNCTION IF EXISTS search_places_by_price_level(text, integer, integer, numeric, numeric, numeric, text, integer, integer);

-- Create proximity-based search function
CREATE OR REPLACE FUNCTION search_places_by_proximity(
  center_lat numeric,
  center_lng numeric,
  search_query text DEFAULT '',
  max_distance numeric DEFAULT 5000,
  min_rating numeric DEFAULT 0,
  max_rating numeric DEFAULT 5,
  min_price_level integer DEFAULT 1,
  max_price_level integer DEFAULT 4,
  sort_order text DEFAULT 'nearest_first', -- 'nearest_first' or 'farthest_first'
  limit_results integer DEFAULT 20,
  offset_results integer DEFAULT 0
) RETURNS SETOF jsonb AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug,
      'description', p.description,
      'main_image', p.main_image,
      'gallery', p.gallery,
      'distance', ST_Distance(
        ST_Point(p.longitude, p.latitude)::geography,
        ST_Point(center_lng, center_lat)::geography
      ),
      'open_now', p.open_now,
      'location', p.location,
      'rate_average', p.rate_average,
      'rate_count', p.rate_count,
      'rate_label', p.rate_label,
      'price_level', p.price_level,
      'price_level_count', p.price_level_count,
      'price_level_label', p.price_level_label,
      'features', p.features,
      'services', p.services,
      'tags', p.tags,
      'accessibility', p.accessibility,
      'source', p.source,
      'country', COALESCE(jsonb_build_object('id', c.id, 'name', c.name), '{}'),
      'region', COALESCE(jsonb_build_object('id', r.id, 'name', r.name), '{}'),
      'city', COALESCE(jsonb_build_object('id', ci.id, 'name', ci.name), '{}'),
      'category', COALESCE(jsonb_build_object('id', cat.id, 'name', cat.name), '{}'),
      'subcategory', COALESCE(jsonb_build_object('id', sub.id, 'name', sub.name), '{}'),
      'type', CASE WHEN t.id IS NOT NULL THEN jsonb_build_object('id', t.id, 'name', t.name) ELSE NULL END,
      'ownership', CASE WHEN o.id IS NOT NULL THEN jsonb_build_object('id', o.id, 'name', o.name) ELSE NULL END
    ) as result
  FROM places p
  LEFT JOIN countries c ON p.country_id = c.id
  LEFT JOIN regions r ON p.region_id = r.id  
  LEFT JOIN cities ci ON p.city_id = ci.id
  LEFT JOIN categories cat ON p.category_id = cat.id
  LEFT JOIN subcategories sub ON p.subcategory_id = sub.id
  LEFT JOIN types t ON p.type_id = t.id
  LEFT JOIN ownerships o ON p.ownership_id = o.id
  WHERE p.status IN ('approved', 'scraped')
    AND (search_query = '' OR p.search_vector @@ websearch_to_tsquery('english', search_query))
    AND COALESCE(p.rate_average, 0) >= min_rating
    AND COALESCE(p.rate_average, 0) <= max_rating
    AND COALESCE(p.price_level, 2) >= min_price_level
    AND COALESCE(p.price_level, 2) <= max_price_level
    AND ST_DWithin(
      ST_Point(p.longitude, p.latitude)::geography,
      ST_Point(center_lng, center_lat)::geography,
      max_distance
    )
  ORDER BY 
    CASE 
      WHEN sort_order = 'nearest_first' THEN ST_Distance(
        ST_Point(p.longitude, p.latitude)::geography,
        ST_Point(center_lng, center_lat)::geography
      )
      WHEN sort_order = 'farthest_first' THEN -ST_Distance(
        ST_Point(p.longitude, p.latitude)::geography,
        ST_Point(center_lng, center_lat)::geography
      )
      ELSE ST_Distance(
        ST_Point(p.longitude, p.latitude)::geography,
        ST_Point(center_lng, center_lat)::geography
      )
    END ASC
  LIMIT limit_results
  OFFSET offset_results;
END;
$$ LANGUAGE plpgsql;

-- Create rating-based search function
CREATE OR REPLACE FUNCTION search_places_by_rating(
  search_query text DEFAULT '',
  min_rating numeric DEFAULT 0,
  max_rating numeric DEFAULT 5,
  center_lat numeric DEFAULT NULL,
  center_lng numeric DEFAULT NULL,
  max_distance numeric DEFAULT 25000,
  sort_order text DEFAULT 'highest_first', -- 'highest_first' or 'lowest_first'
  limit_results integer DEFAULT 20,
  offset_results integer DEFAULT 0
) RETURNS SETOF jsonb AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug,
      'description', p.description,
      'main_image', p.main_image,
      'gallery', p.gallery,
      'distance', CASE 
        WHEN center_lat IS NOT NULL AND center_lng IS NOT NULL THEN
          ST_Distance(
            ST_Point(p.longitude, p.latitude)::geography,
            ST_Point(center_lng, center_lat)::geography
          )
        ELSE 0
      END,
      'open_now', p.open_now,
      'location', p.location,
      'rate_average', p.rate_average,
      'rate_count', p.rate_count,
      'rate_label', p.rate_label,
      'price_level', p.price_level,
      'price_level_count', p.price_level_count,
      'price_level_label', p.price_level_label,
      'features', p.features,
      'services', p.services,
      'tags', p.tags,
      'accessibility', p.accessibility,
      'source', p.source,
      'country', COALESCE(jsonb_build_object('id', c.id, 'name', c.name), '{}'),
      'region', COALESCE(jsonb_build_object('id', r.id, 'name', r.name), '{}'),
      'city', COALESCE(jsonb_build_object('id', ci.id, 'name', ci.name), '{}'),
      'category', COALESCE(jsonb_build_object('id', cat.id, 'name', cat.name), '{}'),
      'subcategory', COALESCE(jsonb_build_object('id', sub.id, 'name', sub.name), '{}'),
      'type', CASE WHEN t.id IS NOT NULL THEN jsonb_build_object('id', t.id, 'name', t.name) ELSE NULL END,
      'ownership', CASE WHEN o.id IS NOT NULL THEN jsonb_build_object('id', o.id, 'name', o.name) ELSE NULL END
    ) as result
  FROM places p
  LEFT JOIN countries c ON p.country_id = c.id
  LEFT JOIN regions r ON p.region_id = r.id  
  LEFT JOIN cities ci ON p.city_id = ci.id
  LEFT JOIN categories cat ON p.category_id = cat.id
  LEFT JOIN subcategories sub ON p.subcategory_id = sub.id
  LEFT JOIN types t ON p.type_id = t.id
  LEFT JOIN ownerships o ON p.ownership_id = o.id
  WHERE p.status IN ('approved', 'scraped')
    AND (search_query = '' OR p.search_vector @@ websearch_to_tsquery('english', search_query))
    AND COALESCE(p.rate_average, 0) >= min_rating
    AND COALESCE(p.rate_average, 0) <= max_rating
    AND (
      center_lat IS NULL OR center_lng IS NULL OR
      ST_DWithin(
        ST_Point(p.longitude, p.latitude)::geography,
        ST_Point(center_lng, center_lat)::geography,
        max_distance
      )
    )
  ORDER BY 
    CASE 
      WHEN sort_order = 'highest_first' THEN -COALESCE(p.rate_average, 0)
      WHEN sort_order = 'lowest_first' THEN COALESCE(p.rate_average, 0)
      ELSE -COALESCE(p.rate_average, 0)
    END ASC,
    -COALESCE(p.rate_count, 0) ASC
  LIMIT limit_results
  OFFSET offset_results;
END;
$$ LANGUAGE plpgsql;

-- Create price level-based search function
CREATE OR REPLACE FUNCTION search_places_by_price_level(
  search_query text DEFAULT '',
  min_price_level integer DEFAULT 1,
  max_price_level integer DEFAULT 4,
  center_lat numeric DEFAULT NULL,
  center_lng numeric DEFAULT NULL,
  max_distance numeric DEFAULT 25000,
  sort_order text DEFAULT 'cheapest_first', -- 'cheapest_first' or 'most_expensive_first'
  limit_results integer DEFAULT 20,
  offset_results integer DEFAULT 0
) RETURNS SETOF jsonb AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug,
      'description', p.description,
      'main_image', p.main_image,
      'gallery', p.gallery,
      'distance', CASE 
        WHEN center_lat IS NOT NULL AND center_lng IS NOT NULL THEN
          ST_Distance(
            ST_Point(p.longitude, p.latitude)::geography,
            ST_Point(center_lng, center_lat)::geography
          )
        ELSE 0
      END,
      'open_now', p.open_now,
      'location', p.location,
      'rate_average', p.rate_average,
      'rate_count', p.rate_count,
      'rate_label', p.rate_label,
      'price_level', p.price_level,
      'price_level_count', p.price_level_count,
      'price_level_label', p.price_level_label,
      'features', p.features,
      'services', p.services,
      'tags', p.tags,
      'accessibility', p.accessibility,
      'source', p.source,
      'country', COALESCE(jsonb_build_object('id', c.id, 'name', c.name), '{}'),
      'region', COALESCE(jsonb_build_object('id', r.id, 'name', r.name), '{}'),
      'city', COALESCE(jsonb_build_object('id', ci.id, 'name', ci.name), '{}'),
      'category', COALESCE(jsonb_build_object('id', cat.id, 'name', cat.name), '{}'),
      'subcategory', COALESCE(jsonb_build_object('id', sub.id, 'name', sub.name), '{}'),
      'type', CASE WHEN t.id IS NOT NULL THEN jsonb_build_object('id', t.id, 'name', t.name) ELSE NULL END,
      'ownership', CASE WHEN o.id IS NOT NULL THEN jsonb_build_object('id', o.id, 'name', o.name) ELSE NULL END
    ) as result
  FROM places p
  LEFT JOIN countries c ON p.country_id = c.id
  LEFT JOIN regions r ON p.region_id = r.id  
  LEFT JOIN cities ci ON p.city_id = ci.id
  LEFT JOIN categories cat ON p.category_id = cat.id
  LEFT JOIN subcategories sub ON p.subcategory_id = sub.id
  LEFT JOIN types t ON p.type_id = t.id
  LEFT JOIN ownerships o ON p.ownership_id = o.id
  WHERE p.status IN ('approved', 'scraped')
    AND (search_query = '' OR p.search_vector @@ websearch_to_tsquery('english', search_query))
    AND COALESCE(p.price_level, 2) >= min_price_level
    AND COALESCE(p.price_level, 2) <= max_price_level
    AND (
      center_lat IS NULL OR center_lng IS NULL OR
      ST_DWithin(
        ST_Point(p.longitude, p.latitude)::geography,
        ST_Point(center_lng, center_lat)::geography,
        max_distance
      )
    )
  ORDER BY 
    CASE 
      WHEN sort_order = 'cheapest_first' THEN COALESCE(p.price_level, 2)
      WHEN sort_order = 'most_expensive_first' THEN -COALESCE(p.price_level, 2)
      ELSE COALESCE(p.price_level, 2)
    END ASC
  LIMIT limit_results
  OFFSET offset_results;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_places_by_proximity(numeric, numeric, text, numeric, numeric, numeric, integer, integer, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION search_places_by_rating(text, numeric, numeric, numeric, numeric, numeric, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION search_places_by_price_level(text, integer, integer, numeric, numeric, numeric, text, integer, integer) TO authenticated; 