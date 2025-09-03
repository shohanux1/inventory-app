-- Add icon and color columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'folder-outline',
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- Update existing categories with default icons and colors
UPDATE categories SET icon = 
  CASE 
    WHEN LOWER(name) LIKE '%electron%' OR LOWER(name) LIKE '%tech%' OR LOWER(name) LIKE '%computer%' THEN 'laptop-outline'
    WHEN LOWER(name) LIKE '%cloth%' OR LOWER(name) LIKE '%fashion%' OR LOWER(name) LIKE '%apparel%' THEN 'shirt-outline'
    WHEN LOWER(name) LIKE '%food%' OR LOWER(name) LIKE '%beverage%' OR LOWER(name) LIKE '%drink%' THEN 'fast-food-outline'
    WHEN LOWER(name) LIKE '%home%' OR LOWER(name) LIKE '%garden%' OR LOWER(name) LIKE '%furniture%' THEN 'home-outline'
    WHEN LOWER(name) LIKE '%sport%' OR LOWER(name) LIKE '%fitness%' OR LOWER(name) LIKE '%gym%' THEN 'basketball-outline'
    WHEN LOWER(name) LIKE '%book%' OR LOWER(name) LIKE '%stationery%' OR LOWER(name) LIKE '%office%' THEN 'book-outline'
    WHEN LOWER(name) LIKE '%toy%' OR LOWER(name) LIKE '%game%' OR LOWER(name) LIKE '%entertainment%' THEN 'game-controller-outline'
    WHEN LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%beauty%' OR LOWER(name) LIKE '%cosmetic%' THEN 'fitness-outline'
    WHEN LOWER(name) LIKE '%car%' OR LOWER(name) LIKE '%auto%' OR LOWER(name) LIKE '%vehicle%' THEN 'car-outline'
    WHEN LOWER(name) LIKE '%music%' OR LOWER(name) LIKE '%audio%' OR LOWER(name) LIKE '%sound%' THEN 'musical-notes-outline'
    WHEN LOWER(name) LIKE '%camera%' OR LOWER(name) LIKE '%photo%' OR LOWER(name) LIKE '%video%' THEN 'camera-outline'
    WHEN LOWER(name) LIKE '%gift%' OR LOWER(name) LIKE '%souvenir%' THEN 'gift-outline'
    WHEN LOWER(name) LIKE '%business%' OR LOWER(name) LIKE '%work%' OR LOWER(name) LIKE '%professional%' THEN 'briefcase-outline'
    WHEN LOWER(name) LIKE '%medical%' OR LOWER(name) LIKE '%pharmacy%' OR LOWER(name) LIKE '%medicine%' THEN 'medkit-outline'
    WHEN LOWER(name) LIKE '%pet%' OR LOWER(name) LIKE '%animal%' THEN 'paw-outline'
    WHEN LOWER(name) LIKE '%flower%' OR LOWER(name) LIKE '%plant%' THEN 'flower-outline'
    ELSE 'folder-outline'
  END
WHERE icon IS NULL OR icon = 'folder-outline';

UPDATE categories SET color = 
  CASE 
    WHEN LOWER(name) LIKE '%electron%' OR LOWER(name) LIKE '%tech%' THEN '#3B82F6'
    WHEN LOWER(name) LIKE '%cloth%' OR LOWER(name) LIKE '%fashion%' THEN '#10B981'
    WHEN LOWER(name) LIKE '%food%' OR LOWER(name) LIKE '%beverage%' THEN '#F59E0B'
    WHEN LOWER(name) LIKE '%home%' OR LOWER(name) LIKE '%garden%' THEN '#8B5CF6'
    WHEN LOWER(name) LIKE '%sport%' OR LOWER(name) LIKE '%fitness%' THEN '#EF4444'
    WHEN LOWER(name) LIKE '%book%' OR LOWER(name) LIKE '%stationery%' THEN '#06B6D4'
    WHEN LOWER(name) LIKE '%toy%' OR LOWER(name) LIKE '%game%' THEN '#EC4899'
    WHEN LOWER(name) LIKE '%health%' OR LOWER(name) LIKE '%beauty%' THEN '#84CC16'
    ELSE '#3B82F6'
  END
WHERE color IS NULL OR color = '#3B82F6';