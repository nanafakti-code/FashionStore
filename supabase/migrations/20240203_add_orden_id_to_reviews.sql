-- Add orden_id column to resenas table
ALTER TABLE resenas 
ADD COLUMN IF NOT EXISTS orden_id UUID REFERENCES ordenes(id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resenas_orden_id ON resenas(orden_id);
