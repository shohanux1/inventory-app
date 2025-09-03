-- Create print queue table for Chrome extension to poll
CREATE TABLE IF NOT EXISTS print_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    printed_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id)
);

-- Create index for efficient polling
CREATE INDEX idx_print_queue_status ON print_queue(status, created_at);
CREATE INDEX idx_print_queue_sale_id ON print_queue(sale_id);

-- RLS policies
ALTER TABLE print_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own print jobs
CREATE POLICY "Users can view own print jobs" ON print_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own print jobs
CREATE POLICY "Users can create print jobs" ON print_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own print jobs
CREATE POLICY "Users can update own print jobs" ON print_queue
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up old print jobs (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_print_jobs()
RETURNS void AS $$
BEGIN
    DELETE FROM print_queue 
    WHERE created_at < NOW() - INTERVAL '24 hours' 
    AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a cron job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-print-jobs', '0 2 * * *', 'SELECT cleanup_old_print_jobs();');