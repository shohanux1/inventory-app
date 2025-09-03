const fs = require('fs');
const path = require('path');

// Read the products JSON file
const productsFile = '/Users/mdabdullahalnoman/Downloads/products (1).json';
const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

// Extract products array from the JSON structure
const products = productsData.find(item => item.type === 'table' && item.name === 'products').data;

// Category mapping from old IDs to new category names
const categoryMapping = {
  '1': 'Food & Beverage',
  '2': 'Fashion & Beauty', 
  '3': 'Groceries',
  '4': 'Household Products',
  '5': 'Personal Care and Health',
  '6': 'Baby and Kids Products',
  '7': 'Beauty and Cosmetics',
  '8': 'Electronics',
  '9': 'Clothing and Apparel',
  '10': 'Furniture and Home Decor',
  '11': 'Automotive',
  '12': 'Stationery and Office Supplies',
  '13': 'Books, Music, and Entertainment',
  '14': 'Organic and Health Foods'
};

// Brand mapping from old IDs to new brand names
const brandMapping = {
  '1': 'Miscs',
  '2': 'Bajaj',
  '3': 'Mistine',
  '4': 'ACI',
  '5': 'Thai',
  '6': 'Nivea',
  '7': 'Kiam',
  '8': 'Parachute',
  '9': 'Quasem',
  '10': 'Uniliver',
  '11': 'Garnier',
  '12': 'Lakme',
  '13': 'Keo Karpin',
  '14': 'Dabur',
  '15': 'Bashundhara',
  '16': 'Square',
  '17': 'Vitacare',
  '18': 'Eldobaby',
  '19': 'Johnson\'s',
  '20': 'Quick Bite',
  '21': 'Akij',
  '22': 'Mediplus',
  '23': 'UniliverBD',
  '24': 'Tibet',
  '25': 'Radhuni',
  '26': 'Dabur BD',
  '27': 'Bangas',
  '28': 'Rupchanda',
  '29': 'Teer',
  '30': 'RFL',
  '31': 'Nestle',
  '32': 'Fresh'
};

// Generate SQL for seeding products
let sql = `-- Seed products from imported data
-- This script inserts products with proper category and brand references
-- It looks up categories and brands by name to get their UUID

-- Insert products with category and brand lookups by name
INSERT INTO products (
    name,
    sku,
    barcode,
    price,
    cost_price,
    stock_quantity,
    min_stock_level,
    category_id,
    brand_id,
    description
)
SELECT * FROM (VALUES
`;

const productValues = [];
const seenSkus = new Set();

products.forEach((product, index) => {
  // Skip if we've already seen this SKU (avoid duplicates)
  if (seenSkus.has(product.code)) {
    return;
  }
  seenSkus.add(product.code);
  
  const categoryName = categoryMapping[product.product_category_id] || 'Groceries';
  const brandName = brandMapping[product.brand_id] || 'Miscs';
  
  // Clean and format values
  const name = product.name.replace(/'/g, "''");
  const sku = product.product_code || product.code;
  const barcode = product.code;
  const price = parseFloat(product.product_price) || 0;
  const costPrice = parseFloat(product.product_cost) || 0;
  const minStock = parseInt(product.stock_alert) || 0;
  
  // Build description from variant info (size/type from code suffix)
  let description = '';
  if (product.code && product.code.includes('-')) {
    const variant = product.code.split('-')[1];
    description = `Variant: ${variant}`;
  }
  
  productValues.push(`(
    '${name}'::varchar,
    '${sku}'::varchar,
    '${barcode}'::varchar,
    ${price}::decimal,
    ${costPrice}::decimal,
    0::integer,
    ${minStock}::integer,
    '${categoryName}'::varchar,
    '${brandName.replace(/'/g, "''")}'::varchar,
    ${description ? `'${description}'::text` : 'NULL::text'}
  )`);
});

// Join all values and complete the SQL with proper column mapping
sql += productValues.slice(0, 100).join(',\n') + `
) AS v(
    name, sku, barcode, price, cost_price, stock_quantity,
    min_stock_level, category_name, brand_name, description
)
LEFT JOIN categories c ON c.name = v.category_name
LEFT JOIN brands b ON b.name = v.brand_name
RETURNING (v.name, v.sku, v.barcode, v.price, v.cost_price, 
          v.stock_quantity, v.min_stock_level, c.id, b.id, v.description)
ON CONFLICT (sku) DO NOTHING;`;

// Add a note about remaining products
if (productValues.length > 100) {
  sql += `\n\n-- Note: This script only includes the first 100 products.`;
  sql += `\n-- Total products to import: ${productValues.length}`;
  sql += `\n-- To import all products, run the full script or import in batches.`;
}

// Save the SQL file
const outputPath = path.join(__dirname, '../supabase/seed-products.sql');
fs.writeFileSync(outputPath, sql);

console.log(`✅ Generated SQL seed file with ${Math.min(100, productValues.length)} products`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`📊 Total unique products found: ${productValues.length}`);

// Also create a full version for reference
const fullSql = `-- Full product import (${productValues.length} products)
-- WARNING: Large import, consider running in batches

-- Create temporary mapping tables
CREATE TEMP TABLE IF NOT EXISTS category_mapping AS
SELECT id, name FROM categories;

CREATE TEMP TABLE IF NOT EXISTS brand_mapping AS  
SELECT id, name FROM brands;

-- Insert all products
INSERT INTO products (
    name, sku, barcode, price, cost_price, stock_quantity,
    min_stock_level, category_id, brand_id, description
) VALUES
${productValues.join(',\n')}
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    barcode = EXCLUDED.barcode,
    price = EXCLUDED.price,
    cost_price = EXCLUDED.cost_price,
    min_stock_level = EXCLUDED.min_stock_level,
    category_id = EXCLUDED.category_id,
    brand_id = EXCLUDED.brand_id,
    updated_at = CURRENT_TIMESTAMP;`;

const fullOutputPath = path.join(__dirname, '../supabase/seed-products-full.sql');
fs.writeFileSync(fullOutputPath, fullSql);
console.log(`📁 Full version saved to: ${fullOutputPath}`);