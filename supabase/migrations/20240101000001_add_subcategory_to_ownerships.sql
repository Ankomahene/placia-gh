-- Add subcategory_id to ownerships table to associate ownerships with specific subcategories
ALTER TABLE ownerships ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_ownerships_subcategory_id ON ownerships(subcategory_id);

-- Update existing ownerships to have a default subcategory_id if needed
-- (You may want to run this manually to assign appropriate subcategories)
-- UPDATE ownerships SET subcategory_id = 'some-default-subcategory-id' WHERE subcategory_id IS NULL; 