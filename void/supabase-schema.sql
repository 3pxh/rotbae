-- Supabase schema for void app pixel storage
-- This table stores only black pixels (white is the default)

CREATE TABLE IF NOT EXISTS black_pixels (
  x INTEGER NOT NULL CHECK (x >= 0 AND x < 1024),
  y INTEGER NOT NULL CHECK (y >= 0 AND y < 1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (x, y)
);

-- Index for fast coordinate lookups
CREATE INDEX IF NOT EXISTS idx_black_pixels_coords ON black_pixels(x, y);

-- Row Level Security (RLS) policies
-- Adjust these based on your access requirements

-- Enable RLS
ALTER TABLE black_pixels ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read black pixels (public read)
CREATE POLICY "Allow public read access" ON black_pixels
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert black pixels
-- Adjust this based on your auth requirements
CREATE POLICY "Allow authenticated insert" ON black_pixels
  FOR INSERT
  WITH CHECK (true); -- Change to: auth.role() = 'authenticated' if using auth

-- Policy: Allow updates (if needed)
CREATE POLICY "Allow authenticated update" ON black_pixels
  FOR UPDATE
  USING (true); -- Change to: auth.role() = 'authenticated' if using auth

-- Database function to insert black pixels (for webhook use)
-- This function runs with SECURITY DEFINER, so it bypasses RLS
CREATE OR REPLACE FUNCTION insert_black_pixel(pixel_x INTEGER, pixel_y INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO black_pixels (x, y)
  VALUES (pixel_x, pixel_y)
  ON CONFLICT (x, y) DO NOTHING;
END;
$$;

-- Grant execute permission to anon role (for Edge Functions)
GRANT EXECUTE ON FUNCTION insert_black_pixel(INTEGER, INTEGER) TO anon;

