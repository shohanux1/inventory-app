-- Migration to enable negative stock quantities
-- This allows products to have negative stock when sales exceed available inventory

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_product_stock ON stock_movements;

-- Update the function to allow negative stock
CREATE OR REPLACE FUNCTION update_product_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE products
    SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    -- CHANGED: Remove GREATEST function to allow negative stock
    UPDATE products
    SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'adjustment' THEN
    -- For adjustments, the quantity is the new absolute value (can be negative)
    UPDATE products
    SET stock_quantity = NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the updated function
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_movement();

-- Optional: Add a new alert type for negative stock
ALTER TABLE stock_alerts
DROP CONSTRAINT IF EXISTS stock_alerts_alert_type_check;

ALTER TABLE stock_alerts
ADD CONSTRAINT stock_alerts_alert_type_check
CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'negative_stock'));

-- Optional: Create a function to check for negative stock alerts
CREATE OR REPLACE FUNCTION check_negative_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record stock_alerts%ROWTYPE;
BEGIN
  -- Check if stock went negative
  IF NEW.stock_quantity < 0 THEN
    -- Check for existing negative stock alert
    SELECT * INTO alert_record
    FROM stock_alerts
    WHERE product_id = NEW.id
      AND alert_type = 'negative_stock'
      AND is_active = true
    LIMIT 1;

    -- If no active alert exists, we could create one (optional)
    IF NOT FOUND THEN
      -- You can uncomment this to auto-create alerts for negative stock
      /*
      INSERT INTO stock_alerts (product_id, alert_type, threshold, is_active, user_id)
      VALUES (NEW.id, 'negative_stock', 0, true, auth.uid());
      */

      -- Just update the last_triggered if alert exists
      UPDATE stock_alerts
      SET last_triggered = NOW()
      WHERE product_id = NEW.id
        AND alert_type = 'negative_stock';
    ELSE
      -- Update existing alert
      UPDATE stock_alerts
      SET last_triggered = NOW()
      WHERE id = alert_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for negative stock alerts
DROP TRIGGER IF EXISTS trigger_check_negative_stock ON products;
CREATE TRIGGER trigger_check_negative_stock
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW
WHEN (NEW.stock_quantity < 0)
EXECUTE FUNCTION check_negative_stock_alerts();

-- Add comment for documentation
COMMENT ON FUNCTION update_product_stock_on_movement() IS 'Updates product stock quantity on stock movements. Allows negative stock for backorder scenarios.';