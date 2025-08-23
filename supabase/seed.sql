-- Sample data for POS system

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Food & Beverages', 'Consumable products'),
('Home & Garden', 'Household items and garden supplies'),
('Sports & Outdoors', 'Sports equipment and outdoor gear');

-- Insert suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
('TechWorld Distributors', 'John Smith', 'john@techworld.com', '555-0100', '123 Tech Street, Silicon Valley, CA'),
('Fashion Hub Wholesale', 'Sarah Johnson', 'sarah@fashionhub.com', '555-0101', '456 Fashion Ave, New York, NY'),
('Fresh Foods Supply', 'Mike Brown', 'mike@freshfoods.com', '555-0102', '789 Market Road, Chicago, IL');

-- Insert products
INSERT INTO products (name, sku, barcode, price, cost_price, stock_quantity, min_stock_level, category_id, supplier_id, description) VALUES
('iPhone 15 Pro Max', 'IPH-15PM-256', '194252818435', 1199.99, 950.00, 45, 10, 
    (SELECT id FROM categories WHERE name = 'Electronics'), 
    (SELECT id FROM suppliers WHERE name = 'TechWorld Distributors'),
    '256GB Storage, Titanium finish'),
    
('MacBook Air M2', 'MB-AIR-M2-512', '194252789512', 1499.99, 1200.00, 8, 5,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'TechWorld Distributors'),
    '13-inch, M2 chip, 512GB SSD'),
    
('iPad Pro 12.9', 'IPAD-PRO-129', '735745809198', 1099.99, 850.00, 0, 5,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'TechWorld Distributors'),
    '12.9-inch display, Wi-Fi, 128GB'),
    
('Samsung Galaxy S24', 'SAM-S24-256', '887276543210', 999.99, 750.00, 32, 10,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'TechWorld Distributors'),
    '256GB Storage, Phantom Black'),
    
('Sony WH-1000XM5', 'SONY-WH-XM5', '027242918511', 399.99, 280.00, 25, 8,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'TechWorld Distributors'),
    'Wireless Noise Cancelling Headphones'),
    
('Nike Air Max 270', 'NIKE-AM270-42', '091206543879', 150.00, 90.00, 20, 10,
    (SELECT id FROM categories WHERE name = 'Clothing'),
    (SELECT id FROM suppliers WHERE name = 'Fashion Hub Wholesale'),
    'Size 42, Black/White colorway'),
    
('Levis 501 Jeans', 'LEVI-501-32', '005303123456', 89.99, 45.00, 35, 15,
    (SELECT id FROM categories WHERE name = 'Clothing'),
    (SELECT id FROM suppliers WHERE name = 'Fashion Hub Wholesale'),
    'Classic fit, 32x32, Dark Blue'),
    
('Organic Coffee Beans 1kg', 'COFFEE-ORG-1KG', '123456789012', 24.99, 15.00, 100, 20,
    (SELECT id FROM categories WHERE name = 'Food & Beverages'),
    (SELECT id FROM suppliers WHERE name = 'Fresh Foods Supply'),
    'Premium Arabica beans, Medium roast');

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, loyalty_points) VALUES
('Alice Johnson', 'alice@email.com', '555-1001', '123 Main St, Anytown, USA', 150),
('Bob Williams', 'bob@email.com', '555-1002', '456 Oak Ave, Somewhere, USA', 75),
('Charlie Davis', 'charlie@email.com', '555-1003', '789 Pine Rd, Elsewhere, USA', 200),
('Diana Miller', 'diana@email.com', '555-1004', '321 Elm St, Nowhere, USA', 50),
('Eve Wilson', 'eve@email.com', '555-1005', '654 Maple Dr, Anywhere, USA', 300);