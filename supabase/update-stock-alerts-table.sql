-- Add missing columns to stock_alerts table if they don't exist
ALTER TABLE stock_alerts 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT false;

-- Update the alert_type check constraint to be more flexible
ALTER TABLE stock_alerts DROP CONSTRAINT IF EXISTS stock_alerts_alert_type_check;
ALTER TABLE stock_alerts ADD CONSTRAINT stock_alerts_alert_type_check 
  CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'reorder_point'));

-- Create an index for acknowledged status
CREATE INDEX IF NOT EXISTS idx_stock_alerts_acknowledged ON stock_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_severity ON stock_alerts(severity);