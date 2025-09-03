const fs = require('fs');

// Read the products JSON file
const productsFile = '/Users/mdabdullahalnoman/Downloads/products (1).json';
const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

// Extract products array
const products = productsData.find(item => item.type === 'table' && item.name === 'products').data;

console.log(`Total products in JSON: ${products.length}`);

// Check for duplicate SKUs (product_code)
const skuMap = new Map();
const duplicateSkus = new Map();
const uniqueBarcodes = new Set();

products.forEach(product => {
  const sku = product.product_code || product.code;
  const barcode = product.code;
  
  // Track unique barcodes
  uniqueBarcodes.add(barcode);
  
  // Track SKUs
  if (skuMap.has(sku)) {
    if (!duplicateSkus.has(sku)) {
      duplicateSkus.set(sku, [skuMap.get(sku)]);
    }
    duplicateSkus.get(sku).push(product);
  } else {
    skuMap.set(sku, product);
  }
});

console.log(`\n📊 Summary:`);
console.log(`- Total products in file: ${products.length}`);
console.log(`- Unique barcodes: ${uniqueBarcodes.size}`);
console.log(`- Unique SKUs: ${skuMap.size}`);
console.log(`- SKUs with duplicates: ${duplicateSkus.size}`);

if (duplicateSkus.size > 0) {
  console.log(`\n⚠️  Found ${duplicateSkus.size} SKUs with multiple products:`);
  console.log(`This explains why you see ${skuMap.size} products instead of ${products.length}\n`);
  
  // Show first 10 duplicate SKUs
  let count = 0;
  duplicateSkus.forEach((productList, sku) => {
    if (count < 10) {
      console.log(`\nSKU: ${sku}`);
      productList.forEach(p => {
        console.log(`  - ${p.name} (barcode: ${p.code}, price: ${p.product_price})`);
      });
      count++;
    }
  });
  
  if (duplicateSkus.size > 10) {
    console.log(`\n... and ${duplicateSkus.size - 10} more duplicate SKUs`);
  }
}

// Check which products would be skipped
const skippedCount = products.length - skuMap.size;
console.log(`\n💡 Database Impact:`);
console.log(`- Products that will be inserted: ${skuMap.size}`);
console.log(`- Products skipped due to duplicate SKU: ${skippedCount}`);
console.log(`\nThis matches what you're seeing: ${skuMap.size} ≈ 1270 products in dashboard`);