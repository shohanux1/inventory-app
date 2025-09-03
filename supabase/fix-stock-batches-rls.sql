-- Fix stock_batches RLS policies
-- First, drop the overly permissive public read policy if it exists
DROP POLICY IF EXISTS "Allow public read access" ON stock_batches;

-- Ensure RLS is enabled
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies based on your existing pattern
-- These policies ensure users can only access their own stock batch data

-- Policy for authenticated users to view their own stock batches
DROP POLICY IF EXISTS "Users can view their own stock batches" ON stock_batches;
CREATE POLICY "Users can view their own stock batches" ON stock_batches
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for authenticated users to create their own stock batches
DROP POLICY IF EXISTS "Users can create their own stock batches" ON stock_batches;
CREATE POLICY "Users can create their own stock batches" ON stock_batches
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own stock batches
DROP POLICY IF EXISTS "Users can update their own stock batches" ON stock_batches;
CREATE POLICY "Users can update their own stock batches" ON stock_batches
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own stock batches
DROP POLICY IF EXISTS "Users can delete their own stock batches" ON stock_batches;
CREATE POLICY "Users can delete their own stock batches" ON stock_batches
  FOR DELETE 
  USING (auth.uid() = user_id);

-- If you need anonymous access for specific operations (like POS terminals),
-- uncomment and modify this policy:
-- CREATE POLICY "Allow anon read for POS operations" ON stock_batches
--   FOR SELECT
--   USING (
--     auth.role() = 'anon' 
--     AND status = 'completed'
--     AND created_at >= NOW() - INTERVAL '24 hours'
--   );

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'stock_batches'
ORDER BY policyname;