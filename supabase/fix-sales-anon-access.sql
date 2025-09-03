-- Allow Chrome extension (anon) to read sales data for printing
-- This is needed for the extension to fetch complete sale details

-- First, check existing policies on sales table
-- DROP POLICY IF EXISTS [existing_policy_name] ON sales;

-- Create policy to allow anon to read sales (for Chrome extension)
CREATE POLICY "Anon can read sales for printing" ON sales
    FOR SELECT 
    USING (true);

-- Create policy to allow anon to read sale_items (for Chrome extension)
CREATE POLICY "Anon can read sale items for printing" ON sale_items
    FOR SELECT 
    USING (true);

-- Create policy to allow anon to read products (for Chrome extension)
CREATE POLICY "Anon can read products for printing" ON products
    FOR SELECT 
    USING (true);

-- Create policy to allow anon to read customers (for Chrome extension)
CREATE POLICY "Anon can read customers for printing" ON customers
    FOR SELECT 
    USING (true);

-- Note: These are permissive policies for the Chrome extension to work
-- In production, you might want to:
-- 1. Create a service role key specifically for the Chrome extension
-- 2. Or use a more restricted approach with specific conditions
-- 3. Or create a public function that returns receipt data

-- Alternative approach: Create a view with no RLS
-- CREATE VIEW public_receipt_data AS
-- SELECT s.*, si.*, p.name as product_name, c.name as customer_name
-- FROM sales s
-- LEFT JOIN sale_items si ON si.sale_id = s.id
-- LEFT JOIN products p ON p.id = si.product_id
-- LEFT JOIN customers c ON c.id = s.customer_id;
-- 
-- GRANT SELECT ON public_receipt_data TO anon;