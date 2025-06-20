-- Add likes array columns to reviews and user_uploaded_photos tables
-- This replaces the need for separate likes tables

-- Add likes array to reviews table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'likes'
  ) THEN
    ALTER TABLE reviews ADD COLUMN likes TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add likes array to user_uploaded_photos table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_uploaded_photos' AND column_name = 'likes'
  ) THEN
    ALTER TABLE user_uploaded_photos ADD COLUMN likes TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing records to have empty arrays (if they have NULL)
UPDATE reviews SET likes = '{}' WHERE likes IS NULL;
UPDATE user_uploaded_photos SET likes = '{}' WHERE likes IS NULL;

-- Add indexes for better performance on likes queries
CREATE INDEX IF NOT EXISTS idx_reviews_likes ON reviews USING GIN (likes);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_photos_likes ON user_uploaded_photos USING GIN (likes);

-- Add RLS policies for likes (users can read all likes, but only modify their own)
-- Reviews likes policies
DROP POLICY IF EXISTS "Users can read review likes" ON reviews;
CREATE POLICY "Users can read review likes" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update review likes" ON reviews;
CREATE POLICY "Users can update review likes" ON reviews
  FOR UPDATE USING (auth.uid()::text = ANY(likes) OR auth.uid()::text = user_id);

-- User uploaded photos likes policies  
DROP POLICY IF EXISTS "Users can read photo likes" ON user_uploaded_photos;
CREATE POLICY "Users can read photo likes" ON user_uploaded_photos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update photo likes" ON user_uploaded_photos;
CREATE POLICY "Users can update photo likes" ON user_uploaded_photos
  FOR UPDATE USING (auth.uid()::text = ANY(likes) OR auth.uid()::text = user_id); 