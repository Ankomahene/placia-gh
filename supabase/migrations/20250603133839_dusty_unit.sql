/*
  # Create Place Schema Management Tables

  1. New Tables
    - `place_groupings` - High-level categories for places
    - `place_fields` - Master list of all possible place fields
    - `place_grouping_schema` - Field mappings for groupings

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Create place_groupings table
CREATE TABLE IF NOT EXISTS place_groupings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create place_fields table
CREATE TABLE IF NOT EXISTS place_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('string', 'number', 'boolean', 'array', 'object', 'date')),
  is_array boolean DEFAULT false,
  is_object boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create place_grouping_schema table
CREATE TABLE IF NOT EXISTS place_grouping_schema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grouping_id uuid NOT NULL REFERENCES place_groupings(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES place_fields(id) ON DELETE CASCADE,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(grouping_id, field_id)
);

-- Enable RLS
ALTER TABLE place_groupings ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_grouping_schema ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow full access for admins on place_groupings"
  ON place_groupings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow full access for admins on place_fields"
  ON place_fields
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow full access for admins on place_grouping_schema"
  ON place_grouping_schema
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at triggers
CREATE TRIGGER update_place_groupings_updated_at
  BEFORE UPDATE ON place_groupings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_fields_updated_at
  BEFORE UPDATE ON place_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_place_grouping_schema_updated_at
  BEFORE UPDATE ON place_grouping_schema
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();