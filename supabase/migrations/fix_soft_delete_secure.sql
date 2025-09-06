-- Fix Soft Delete Implementation
-- This migration properly drops and recreates functions with correct return types

-- First, drop existing functions if they exist
DROP FUNCTION IF EXISTS soft_delete_product(UUID);
DROP FUNCTION IF EXISTS restore_product(UUID);
DROP FUNCTION IF EXISTS get_active_products();
DROP FUNCTION IF EXISTS get_archived_products();
DROP FUNCTION IF EXISTS permanently_delete_product(UUID);

-- Drop views if they exist (from previous migration)
DROP VIEW IF EXISTS active_products;
DROP VIEW IF EXISTS archived_products;

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
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON products;

-- Create a single comprehensive policy for authenticated users
CREATE POLICY "Enable full access for authenticated users" ON products
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create helper functions for soft delete operations
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
GRANT EXECUTE ON FUNCTION soft_delete_product TO authenticated;
GRANT EXECUTE ON FUNCTION restore_product TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_product TO authenticated;

-- Add comment to products table about soft delete
COMMENT ON COLUMN products.deleted_at IS 'Timestamp when the product was soft deleted. NULL means the product is active.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Soft delete implementation completed successfully!';
END $$;