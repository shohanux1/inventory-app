-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read print jobs" ON print_queue;
DROP POLICY IF EXISTS "Authenticated users can create print jobs" ON print_queue;
DROP POLICY IF EXISTS "Authenticated users can update print jobs" ON print_queue;
DROP POLICY IF EXISTS "Users can delete own print jobs" ON print_queue;

-- Create policies that allow anon access for Chrome extension

-- Allow ANYONE (including anon/Chrome extension) to read print jobs
CREATE POLICY "Anyone can read print jobs" ON print_queue
    FOR SELECT 
    USING (true);

-- Allow authenticated users to create print jobs with their user_id
CREATE POLICY "Authenticated users can create print jobs" ON print_queue
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow ANYONE (including anon/Chrome extension) to update print job status
CREATE POLICY "Anyone can update print jobs" ON print_queue
    FOR UPDATE 
    USING (true);

-- Allow authenticated users to delete their own old print jobs
CREATE POLICY "Users can delete own print jobs" ON print_queue
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Alternative: Completely disable RLS for testing
-- This will make the table fully accessible without any restrictions
-- Uncomment the line below to disable RLS:
-- ALTER TABLE print_queue DISABLE ROW LEVEL SECURITY;