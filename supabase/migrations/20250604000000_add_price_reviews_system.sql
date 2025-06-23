/*
  # Add Price Reviews System

  1. New Tables
    - `price_reviews` - User-submitted price level reviews

  2. Functions
    - `update_place_price_fields()` - Aggregates price reviews into places table

  3. Triggers
    - Automatic price level calculation on review changes
    - Updated_at trigger for price_reviews

  4. Security
    - Enable RLS on price_reviews table
    - Add appropriate policies
*/

-- Create price_reviews table
CREATE TABLE IF NOT EXISTS price_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  price_level_number integer NOT NULL CHECK (price_level_number >= 1 AND price_level_number <= 4),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on price_reviews
ALTER TABLE price_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for price_reviews
CREATE POLICY "Users can view all price reviews" ON price_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own price reviews" ON price_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own price reviews" ON price_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own price reviews" ON price_reviews FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_reviews_place_id ON price_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_price_reviews_user_id ON price_reviews(user_id);

-- Ensure places table has price level fields
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_level integer;
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_level_count integer;
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_level_label text;

-- Create the update_place_price_fields function
CREATE OR REPLACE FUNCTION update_place_price_fields()
RETURNS TRIGGER AS $$
DECLARE
  avg_price_level INTEGER;
  count_price INTEGER;
  label TEXT;
  place TEXT;
BEGIN
  -- Get the correct place_id
  place := COALESCE(NEW.place_id, OLD.place_id);

  -- Calculate count and average (rounded to int)
  SELECT COUNT(*), ROUND(AVG(price_level_number))::INT
  INTO count_price, avg_price_level
  FROM price_reviews
  WHERE place_id = place;

  -- Determine label
  IF avg_price_level IS NULL THEN
    label := NULL;
  ELSIF avg_price_level = 4 THEN
    label := 'very_expensive';
  ELSIF avg_price_level = 3 THEN
    label := 'expensive';
  ELSIF avg_price_level = 2 THEN
    label := 'moderate';
  ELSE
    label := 'budget_friendly';
  END IF;

  -- Update the places table
  UPDATE places
  SET price_level = avg_price_level,
      price_level_count = count_price,
      price_level_label = label
  WHERE id = place;

  -- Update search vector to reflect new price data
  PERFORM update_place_search_vector(place);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_price_fields ON price_reviews;
CREATE TRIGGER trigger_update_price_fields
  AFTER INSERT OR UPDATE OR DELETE ON price_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_place_price_fields();

-- Create updated_at trigger for price_reviews
DROP TRIGGER IF EXISTS update_price_reviews_updated_at ON price_reviews;
CREATE TRIGGER update_price_reviews_updated_at
  BEFORE UPDATE ON price_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON FUNCTION update_place_price_fields IS 'Updates price level aggregates in places table when price_reviews change';
COMMENT ON TABLE price_reviews IS 'User-submitted price level reviews for places (1=budget_friendly, 2=moderate, 3=expensive, 4=very_expensive)';
COMMENT ON COLUMN price_reviews.price_level_number IS 'Price level: 1=budget_friendly, 2=moderate, 3=expensive, 4=very_expensive';

-- Grant permissions
GRANT SELECT ON price_reviews TO authenticated;
GRANT INSERT ON price_reviews TO authenticated;
GRANT UPDATE ON price_reviews TO authenticated;
GRANT DELETE ON price_reviews TO authenticated; 