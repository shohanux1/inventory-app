-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own print jobs" ON print_queue;
DROP POLICY IF EXISTS "Users can create print jobs" ON print_queue;
DROP POLICY IF EXISTS "Users can update own print jobs" ON print_queue;
DROP POLICY IF EXISTS "Enable read for all users" ON print_queue;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON print_queue;
DROP POLICY IF EXISTS "Enable update for all users" ON print_queue;

-- Create more permissive policies for testing
-- You can make these more restrictive later

-- Allow authenticated users to read all print jobs
-- (Chrome extension needs to read jobs from all users)
CREATE POLICY "Authenticated users can read print jobs" ON print_queue
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to create print jobs with their user_id
CREATE POLICY "Authenticated users can create print jobs" ON print_queue
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update any print job
-- (Chrome extension needs to update status)
CREATE POLICY "Authenticated users can update print jobs" ON print_queue
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete their own old print jobs
CREATE POLICY "Users can delete own print jobs" ON print_queue
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Optional: For development/testing, you can temporarily disable RLS
-- WARNING: Only do this for testing!
-- ALTER TABLE print_queue DISABLE ROW LEVEL SECURITY;