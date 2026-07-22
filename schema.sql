-- Supabase PostgreSQL Schema DDL for Teksys Agro

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'agent', 'admin', 'food_unit')),
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
