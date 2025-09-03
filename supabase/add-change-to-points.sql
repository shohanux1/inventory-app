-- Add change_to_points column to sales table
-- This tracks when change is converted to loyalty points instead of cash

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS change_to_points INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN sales.change_to_points IS 'Loyalty points given from change conversion (100 points = ৳1)';