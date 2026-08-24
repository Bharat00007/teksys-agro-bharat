-- Supabase PostgreSQL Schema DDL for Teksys Agro

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'agent', 'admin', 'food_unit', 'customer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Passwords Table (Bcrypt hashes)
CREATE TABLE IF NOT EXISTS user_passwords (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Farmer Profiles Table
CREATE TABLE IF NOT EXISTS farmer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    area VARCHAR(255) NOT NULL,
    village VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Farmer Bank Details Table
CREATE TABLE IF NOT EXISTS farmer_bank_details (
    farmer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_account_number VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Agent Profiles Table
CREATE TABLE IF NOT EXISTS agent_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('bike', 'three_wheeler', 'mini_truck', 'truck')),
    max_weight_kg INT NOT NULL,
    current_area VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Area Pricing Rates Table
CREATE TABLE IF NOT EXISTS area_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    rate_per_kg NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'kg',
    effective_date DATE DEFAULT CURRENT_DATE,
    set_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crop Pickup Requests Table
CREATE TABLE IF NOT EXISTS pickup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    weight_kg NUMERIC(10, 2) NOT NULL,
    rate_per_kg NUMERIC(10, 2),
    estimated_amount NUMERIC(12, 2),
    pickup_address TEXT,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    pickup_address_readable TEXT,
    pickup_landmark TEXT,
    location_set_at TIMESTAMP WITH TIME ZONE,
    preferred_date DATE NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'created' CHECK (status IN (
        'created', 'assigned', 'otp_generated', 'picked_up', 
        'admin_approved', 'payment_pending', 'payment_completed', 'cancelled'
    )),
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Delivery Assignments Table
CREATE TABLE IF NOT EXISTS delivery_assignments (
    pickup_id UUID PRIMARY KEY REFERENCES pickup_requests(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'completed', 'failed')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Status Logs Table (Audit trail)
CREATE TABLE IF NOT EXISTS status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Farmer Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_weight_kg NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'paid', 'cancelled')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    pickup_id UUID REFERENCES pickup_requests(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    weight_kg NUMERIC(10, 2) NOT NULL,
    rate_per_kg NUMERIC(10, 2) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Payout Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    payout_reference_id VARCHAR(255),
    razorpay_payout_id VARCHAR(255),
    payment_mode VARCHAR(100) DEFAULT 'bank_transfer',
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Warehouse Inventory Table (Bought from farmers, sold to food units)
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity_kg NUMERIC(10, 2) DEFAULT 0,
    rate_per_kg NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Food Unit Profiles Table
CREATE TABLE IF NOT EXISTS food_unit_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    gst_number VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Purchase Orders (B2B orders by food units)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_unit_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invoiced', 'delivered')),
    total_amount NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES warehouse_inventory(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    rate_per_kg NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Invoices Table (For B2B orders)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_unit_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    grand_total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- PHASE 2: MARKETPLACE TABLES
-- =====================================================

-- 18. Marketplace Categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon_name VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Marketplace Products
CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES marketplace_categories(id) ON DELETE CASCADE,
    warehouse_inventory_id UUID REFERENCES warehouse_inventory(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    mrp NUMERIC(12, 2) NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'kg',
    weight_value NUMERIC(10, 2) DEFAULT 1,
    stock_quantity INT DEFAULT 0,
    min_order_qty INT DEFAULT 1,
    max_order_qty INT DEFAULT 10,
    is_organic BOOLEAN DEFAULT FALSE,
    origin VARCHAR(255),
    specifications JSONB DEFAULT '{}',
    avg_rating NUMERIC(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    total_sold INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    delivery_time VARCHAR(100) DEFAULT '2-4 hours',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Customer Profiles
CREATE TABLE IF NOT EXISTS customers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    default_address_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FK for default_address_id after customer_addresses is created
ALTER TABLE customers
    ADD CONSTRAINT fk_default_address
    FOREIGN KEY (default_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;

-- 23. Shopping Carts
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 25. Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- 26. Marketplace Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN (
        'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
    )),
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    delivery_charges NUMERIC(12, 2) DEFAULT 0,
    gst_amount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    coupon_code VARCHAR(100),
    payment_method VARCHAR(50) DEFAULT 'cod' CHECK (payment_method IN ('upi', 'card', 'net_banking', 'wallet', 'cod')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    delivery_address_snapshot JSONB NOT NULL,
    delivery_slot VARCHAR(100),
    notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    packed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    out_for_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. Marketplace Order Items
CREATE TABLE IF NOT EXISTS marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    unit VARCHAR(50),
    quantity INT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 28. Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images JSONB DEFAULT '[]',
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, customer_id, order_id)
);

-- 29. Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(12, 2) NOT NULL,
    min_order_amount NUMERIC(12, 2) DEFAULT 0,
    max_discount_amount NUMERIC(12, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. Coupon Usage
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, customer_id)
);

-- 31. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order', 'offer', 'promotion', 'price_drop', 'general')),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Demo Data Inserts

-- 1. Insert Default Admin User
-- Email: admin@teksysagro.com
-- Password: Admin@1234
-- Password Hash: $2a$12$R.S4o4w1jWkK9N0c2F.yruU59.2tS9j2QO0e1R2y1z6e1u4r3t2mO (Example Bcrypt hash)
INSERT INTO users (id, name, phone, email, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'System Administrator', '+919999999999', 'admin@teksysagro.com', 'admin', true)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO user_passwords (user_id, password_hash)
VALUES ('00000000-0000-0000-0000-000000000001', '$2a$12$39eC79j35g5oO322U832Ce919.wU28K2y8z6e1u4r3t2mO59.2tS9') -- Default hashed password Admin@1234
ON CONFLICT (user_id) DO NOTHING;

-- 2. Seed Marketplace Categories
INSERT INTO marketplace_categories (name, slug, description, icon_name, sort_order) VALUES
('Vegetables', 'vegetables', 'Fresh farm vegetables', 'leaf', 1),
('Fruits', 'fruits', 'Seasonal and exotic fruits', 'apple', 2),
('Grains', 'grains', 'Premium quality grains', 'grain', 3),
('Rice', 'rice', 'Basmati and local rice varieties', 'rice', 4),
('Wheat', 'wheat', 'Wheat and wheat products', 'wheat', 5),
('Pulses', 'pulses', 'Dals and lentils', 'seed', 6),
('Dairy', 'dairy', 'Fresh dairy products', 'cow', 7),
('Organic', 'organic', 'Certified organic produce', 'sprout', 8),
('Dry Fruits', 'dry-fruits', 'Nuts and dry fruits', 'peanut', 9),
('Spices', 'spices', 'Indian spices and masalas', 'chili-hot', 10)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Demo Coupons
INSERT INTO coupons (code, title, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until) VALUES
('WELCOME50', 'Welcome Offer', 'Get 50% off on your first order', 'percentage', 50, 200, 150, 1000, NOW() + INTERVAL '90 days'),
('FRESH100', 'Flat ₹100 Off', 'Flat ₹100 off on orders above ₹500', 'flat', 100, 500, NULL, 500, NOW() + INTERVAL '30 days'),
('ORGANIC20', 'Organic Special', '20% off on organic products', 'percentage', 20, 300, 200, 200, NOW() + INTERVAL '60 days')
ON CONFLICT (code) DO NOTHING;
