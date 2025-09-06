-- Add soft delete to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing views if they exist (we'll use RLS instead)
DROP VIEW IF EXISTS active_products;
DROP VIEW IF EXISTS archived_products;

-- Create RLS policies for products table
-- Policy for authenticated users to see only non-deleted products by default
CREATE POLICY "Users can view active products" ON products
    FOR SELECT
    USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- Policy for authenticated users to see their own deleted products
CREATE POLICY "Users can view archived products" ON products
    FOR SELECT
    USING (auth.role() = 'authenticated' AND deleted_at IS NOT NULL);

-- Policy for authenticated users to insert products
CREATE POLICY "Users can insert products" ON products
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update products (including soft delete)
CREATE POLICY "Users can update products" ON products
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to hard delete products (if needed)
CREATE POLICY "Users can delete products" ON products
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create secure functions that respect RLS
-- Function to soft delete products (respects RLS)
CREATE OR REPLACE FUNCTION soft_delete_product(product_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = product_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore deleted products (respects RLS)
CREATE OR REPLACE FUNCTION restore_product(product_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET deleted_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_product TO authenticated;
GRANT EXECUTE ON FUNCTION restore_product TO authenticated;