-- Create stock_movements table for tracking all stock changes
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  reference VARCHAR(255),
  supplier VARCHAR(255),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create stock_alerts table for low stock notifications
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
  threshold INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_user_id ON stock_alerts(user_id);

-- Create function to update product stock quantity
CREATE OR REPLACE FUNCTION update_product_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE products 
    SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE products 
    SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - NEW.quantity, 0),
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'adjustment' THEN
    -- For adjustments, the quantity is the new absolute value
    UPDATE products 
    SET stock_quantity = NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock on movement
DROP TRIGGER IF EXISTS trigger_update_product_stock ON stock_movements;
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_movement();

-- Enable Row Level Security
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_movements
CREATE POLICY "Users can view their own stock movements" ON stock_movements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock movements" ON stock_movements
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock movements" ON stock_movements
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for stock_alerts
CREATE POLICY "Users can view their own stock alerts" ON stock_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock alerts" ON stock_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock alerts" ON stock_alerts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock alerts" ON stock_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to check and trigger stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record stock_alerts%ROWTYPE;
BEGIN
  -- Check for any active alerts for this product
  FOR alert_record IN 
    SELECT * FROM stock_alerts 
    WHERE product_id = NEW.id 
    AND is_active = true
  LOOP
    -- Check for out of stock
    IF NEW.stock_quantity = 0 AND alert_record.alert_type = 'out_of_stock' THEN
      UPDATE stock_alerts 
      SET last_triggered = NOW() 
      WHERE id = alert_record.id;
    -- Check for low stock
    ELSIF NEW.stock_quantity <= alert_record.threshold AND alert_record.alert_type = 'low_stock' THEN
      UPDATE stock_alerts 
      SET last_triggered = NOW() 
      WHERE id = alert_record.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check alerts when product stock changes
DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON products;
CREATE TRIGGER trigger_check_stock_alerts
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW
EXECUTE FUNCTION check_stock_alerts();

-- Add comment for documentation
COMMENT ON TABLE stock_movements IS 'Records all stock movements (in, out, adjustments, transfers) for inventory tracking';
COMMENT ON TABLE stock_alerts IS 'Manages stock alert configurations and triggers for inventory management';
COMMENT ON COLUMN stock_movements.type IS 'Type of stock movement: in (stock received), out (stock sold/used), adjustment (manual correction), transfer (between locations)';
COMMENT ON COLUMN stock_alerts.alert_type IS 'Type of alert: low_stock, out_of_stock, overstock';