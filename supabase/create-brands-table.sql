-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add brand_id to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'brand_id') THEN
        ALTER TABLE products 
        ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

-- Create trigger for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all for authenticated users" ON brands
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert actual brands from your data
INSERT INTO brands (name, description) VALUES 
    ('Miscs', NULL),
    ('Bajaj', NULL),
    ('Mistine', NULL),
    ('ACI', NULL),
    ('Thai', NULL),
    ('Nivea', NULL),
    ('Kiam', NULL),
    ('Parachute', NULL),
    ('Quasem', NULL),
    ('Uniliver', NULL),
    ('Garnier', NULL),
    ('Lakme', NULL),
    ('Keo Karpin', NULL),
    ('Dabur', NULL),
    ('Bashundhara', NULL),
    ('Square', NULL),
    ('Vitacare', NULL),
    ('Eldobaby', NULL),
    ('Johnson''s', NULL),
    ('Quick Bite', NULL),
    ('Akij', NULL),
    ('Mediplus', NULL),
    ('UniliverBD', NULL),
    ('Tibet', NULL),
    ('Radhuni', NULL),
    ('Dabur BD', NULL),
    ('Bangas', NULL),
    ('Rupchanda', NULL),
    ('Teer', NULL),
    ('RFL', NULL),
    ('Nestle', NULL),
    ('Fresh', NULL)
ON CONFLICT (name) DO NOTHING;