-- Create stock_batches table for grouping stock movements (similar to sales table)
CREATE TABLE IF NOT EXISTS stock_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  reference VARCHAR(255),
  supplier VARCHAR(255),
  total_items INTEGER NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  total_value DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Update stock_movements table to link to batch
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES stock_batches(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_batches_user_id ON stock_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_type ON stock_batches(type);
CREATE INDEX IF NOT EXISTS idx_stock_batches_created_at ON stock_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_batches_status ON stock_batches(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch_id ON stock_movements(batch_id);

-- Enable Row Level Security
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_batches
CREATE POLICY "Users can view their own stock batches" ON stock_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock batches" ON stock_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock batches" ON stock_batches
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock batches" ON stock_batches
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger to calculate batch totals
CREATE OR REPLACE FUNCTION update_batch_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_items INTEGER;
  v_total_quantity INTEGER;
  v_total_value DECIMAL(10, 2);
BEGIN
  -- Only update if batch_id is not null
  IF NEW.batch_id IS NOT NULL THEN
    -- Calculate totals for the batch
    SELECT 
      COUNT(*),
      COALESCE(SUM(quantity), 0),
      COALESCE(SUM(quantity * COALESCE(p.cost_price, p.price, 0)), 0)
    INTO v_total_items, v_total_quantity, v_total_value
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    WHERE sm.batch_id = NEW.batch_id;
    
    -- Update the batch totals
    UPDATE stock_batches
    SET 
      total_items = v_total_items,
      total_quantity = v_total_quantity,
      total_value = v_total_value,
      updated_at = NOW()
    WHERE id = NEW.batch_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update batch totals when stock movements are added
DROP TRIGGER IF EXISTS trigger_update_batch_totals ON stock_movements;
CREATE TRIGGER trigger_update_batch_totals
AFTER INSERT OR UPDATE OF batch_id ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_batch_totals();

-- Function to get stock batch with items
CREATE OR REPLACE FUNCTION get_stock_batch_with_items(p_batch_id UUID)
RETURNS TABLE (
  batch_id UUID,
  batch_type VARCHAR,
  batch_reference VARCHAR,
  batch_supplier VARCHAR,
  batch_notes TEXT,
  batch_created_at TIMESTAMP WITH TIME ZONE,
  product_id UUID,
  product_name VARCHAR,
  product_sku VARCHAR,
  quantity INTEGER,
  movement_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sb.id,
    sb.type,
    sb.reference,
    sb.supplier,
    sb.notes,
    sb.created_at,
    sm.product_id,
    p.name,
    p.sku,
    sm.quantity,
    sm.notes
  FROM stock_batches sb
  LEFT JOIN stock_movements sm ON sb.id = sm.batch_id
  LEFT JOIN products p ON sm.product_id = p.id
  WHERE sb.id = p_batch_id
  ORDER BY sm.created_at;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE stock_batches IS 'Groups related stock movements into batches (similar to sales table)';
COMMENT ON COLUMN stock_batches.type IS 'Type of batch: in (receiving), out (dispatch), adjustment, transfer';
COMMENT ON COLUMN stock_movements.batch_id IS 'Links movement to a batch for grouped operations';