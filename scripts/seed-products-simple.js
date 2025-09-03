const fs = require('fs');

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

// Generate SQL that looks up UUIDs by name
let sql = `-- Seed products from imported data
-- This script looks up category and brand UUIDs by their names

-- Make sure we have the required categories and brands first
-- Run seed-categories.sql and create-brands-table.sql before this!

-- Insert products with dynamic UUID lookups
`;

const seenSkus = new Set();
let productCount = 0;
const batchSize = 50; // Insert in smaller batches
let currentBatchCount = 0;

products.forEach((product, index) => {
  // Skip duplicates
  if (seenSkus.has(product.code)) {
    return;
  }
  seenSkus.add(product.code);
  
  // Start new INSERT statement for each batch
  if (currentBatchCount === 0) {
    if (productCount > 0) {
      sql += '\nON CONFLICT (sku) DO NOTHING;\n\n';
    }
    sql += `-- Batch ${Math.floor(productCount / batchSize) + 1}\n`;
    sql += `INSERT INTO products (
    name, sku, barcode, price, cost_price, stock_quantity,
    min_stock_level, category_id, brand_id, description
) VALUES\n`;
  } else {
    sql += ',\n';
  }
  
  const categoryName = categoryMapping[product.product_category_id] || 'Groceries';
  const brandName = brandMapping[product.brand_id] || 'Miscs';
  
  // Clean values
  const name = product.name.replace(/'/g, "''");
  const sku = product.product_code || product.code;
  const barcode = product.code;
  const price = parseFloat(product.product_price) || 0;
  const costPrice = parseFloat(product.product_cost) || 0;
  const minStock = parseInt(product.stock_alert) || 0;
  
  // Build description from variant info
  let description = 'NULL';
  if (product.code && product.code.includes('-')) {
    const variant = product.code.split('-')[1];
    description = `'Variant: ${variant}'`;
  }
  
  // Add the VALUES row with UUID lookups
  sql += `(
    '${name}',
    '${sku}',
    '${barcode}',
    ${price},
    ${costPrice},
    0,
    ${minStock},
    (SELECT id FROM categories WHERE name = '${categoryName}' LIMIT 1),
    (SELECT id FROM brands WHERE name = '${brandName.replace(/'/g, "''")}' LIMIT 1),
    ${description}
)`;
  
  productCount++;
  currentBatchCount++;
  
  // Reset batch counter when we hit batch size
  if (currentBatchCount >= batchSize) {
    currentBatchCount = 0;
  }
});

// Close the last INSERT statement
if (currentBatchCount > 0) {
  sql += '\nON CONFLICT (sku) DO NOTHING;\n';
}

// Add summary
sql += `\n-- Summary:\n`;
sql += `-- Products inserted: ${productCount}\n`;
sql += `-- Categories used: ${Object.keys(categoryMapping).length}\n`;
sql += `-- Brands used: ${Object.keys(brandMapping).length}\n`;

// Save the SQL file
const outputPath = '/Users/mdabdullahalnoman/my-pos/supabase/seed-products.sql';
fs.writeFileSync(outputPath, sql);

console.log(`✅ Generated SQL seed file with ${productCount} products`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`\n📋 Instructions:`);
console.log(`1. First run: supabase/seed-categories.sql`);
console.log(`2. Then run: supabase/create-brands-table.sql`);
console.log(`3. Finally run: supabase/seed-products.sql`);
console.log(`\nThe script will look up category and brand UUIDs by name.`);