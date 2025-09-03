-- Seed categories with appropriate icons and colors
-- First ensure the icon and color columns exist
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'folder-outline',
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- Add unique constraint on name if it doesn't exist (safe approach)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'categories_name_unique'
    ) THEN
        ALTER TABLE categories 
        ADD CONSTRAINT categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- Insert categories from your data with appropriate icons and colors
INSERT INTO categories (name, icon, color, description) VALUES 
    ('Food & Beverage', 'fast-food-outline', '#F59E0B', 'Food and drink products'),
    ('Fashion & Beauty', 'shirt-outline', '#EC4899', 'Fashion and beauty items'),
    ('Groceries', 'basket-outline', '#10B981', 'Daily grocery items'),
    ('Household Products', 'home-outline', '#8B5CF6', 'Home and household items'),
    ('Personal Care and Health', 'fitness-outline', '#84CC16', 'Personal care and health products'),
    ('Baby and Kids Products', 'happy-outline', '#06B6D4', 'Products for babies and children'),
    ('Beauty and Cosmetics', 'sparkles-outline', '#EC4899', 'Beauty and cosmetic products'),
    ('Electronics', 'laptop-outline', '#3B82F6', 'Electronic devices and accessories'),
    ('Clothing and Apparel', 'shirt-outline', '#10B981', 'Clothing and fashion apparel'),
    ('Furniture and Home Decor', 'bed-outline', '#8B5CF6', 'Furniture and decorative items'),
    ('Automotive', 'car-outline', '#EF4444', 'Automotive products and accessories'),
    ('Stationery and Office Supplies', 'document-text-outline', '#06B6D4', 'Office and stationery items'),
    ('Books, Music, and Entertainment', 'book-outline', '#F97316', 'Books, music and entertainment'),
    ('Organic and Health Foods', 'leaf-outline', '#84CC16', 'Organic and healthy food products')
ON CONFLICT (name) DO UPDATE 
SET 
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Alternative: If you want to match exactly with the existing sample categories from categories.tsx
-- You can use these instead:
/*
INSERT INTO categories (name, icon, color, description) VALUES 
    ('Electronics', 'laptop-outline', '#3B82F6', 'Electronic devices and accessories'),
    ('Clothing', 'shirt-outline', '#10B981', 'Clothing and fashion items'),
    ('Food & Beverages', 'fast-food-outline', '#F59E0B', 'Food and drink products'),
    ('Home & Garden', 'home-outline', '#8B5CF6', 'Home and garden items'),
    ('Sports', 'basketball-outline', '#EF4444', 'Sports equipment and accessories'),
    ('Books', 'book-outline', '#06B6D4', 'Books and reading materials'),
    ('Toys & Games', 'game-controller-outline', '#EC4899', 'Toys and gaming products'),
    ('Health & Beauty', 'fitness-outline', '#84CC16', 'Health and beauty products')
ON CONFLICT (name) DO UPDATE 
SET 
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
*/