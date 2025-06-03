/*
  # Add Grouping Support to Subcategories

  1. Changes
    - Add grouping_id column to subcategories table
    - Add foreign key constraint to place_groupings table
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add grouping_id column to subcategories
ALTER TABLE subcategories
ADD COLUMN IF NOT EXISTS grouping_id uuid REFERENCES place_groupings(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_grouping_id ON subcategories(grouping_id);