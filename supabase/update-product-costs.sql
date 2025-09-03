-- Update products with missing cost prices
-- Assuming a 20% profit margin (cost = 80% of selling price) for products without cost_price

-- First, let's see which products don't have cost prices
SELECT id, name, price, cost_price 
FROM products 
WHERE cost_price IS NULL OR cost_price = 0;

-- Update products that don't have cost_price set
-- Using 80% of selling price as default cost (20% profit margin)
UPDATE products 
SET cost_price = ROUND(price * 0.8, 2),
    updated_at = TIMEZONE('utc', NOW())
WHERE cost_price IS NULL OR cost_price = 0;

-- Verify the update
SELECT id, name, price, cost_price, 
       ROUND((price - cost_price), 2) as profit,
       ROUND(((price - cost_price) / price * 100), 2) as profit_margin_percent
FROM products
ORDER BY name;

-- Example of how loyalty points would be calculated:
-- If a product sells for $100 and costs $80:
-- Profit = $20
-- Loyalty points = 5% of $20 = $1.00 = 100 points (since 1 point = 1 cent)