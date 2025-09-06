-- Secure Soft Delete Implementation for Products
-- This migration adds soft delete functionality with proper RLS policies

-- Add soft delete column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view active products" ON products;
DROP POLICY IF EXISTS "Users can view archived products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;

-- Create a single comprehensive policy for authenticated users
-- This gives full access to authenticated users for their products
CREATE POLICY "Enable full access for authenticated users" ON products
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Alternative: If you want to track user-specific products, use this instead:
-- CREATE POLICY "Users can manage their own products" ON products
--     FOR ALL
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- Create helper functions for soft delete operations
-- These functions are SECURITY INVOKER (default) so they respect RLS

-- Function to get active products (non-deleted)
CREATE OR REPLACE FUNCTION get_active_products()
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM products 
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get archived products (deleted)
CREATE OR REPLACE FUNCTION get_archived_products()
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM products 
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to soft delete a product
CREATE OR REPLACE FUNCTION soft_delete_product(product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE products 
    SET 
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        id = product_id 
        AND deleted_at IS NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a deleted product
CREATE OR REPLACE FUNCTION restore_product(product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE products 
    SET 
        deleted_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        id = product_id 
        AND deleted_at IS NOT NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete a product
CREATE OR REPLACE FUNCTION permanently_delete_product(product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    DELETE FROM products 
    WHERE 
        id = product_id 
        AND deleted_at IS NOT NULL; -- Only allow permanent deletion of already soft-deleted products
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_archived_products TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_product TO authenticated;
GRANT EXECUTE ON FUNCTION restore_product TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_product TO authenticated;

-- Add comment to products table about soft delete
COMMENT ON COLUMN products.deleted_at IS 'Timestamp when the product was soft deleted. NULL means the product is active.';