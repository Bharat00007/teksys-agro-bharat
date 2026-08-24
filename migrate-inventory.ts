import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateInventory() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // 1. Add inventory columns to marketplace_products
    console.log('Adding inventory columns to marketplace_products...');

    const columns = [
      { name: 'sku', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);` },
      { name: 'batch_number', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);` },
      { name: 'purchase_price', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) DEFAULT 0;` },
      { name: 'min_stock_level', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS min_stock_level INT DEFAULT 5;` },
      { name: 'expiry_date', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS expiry_date DATE;` },
      { name: 'manufacturing_date', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS manufacturing_date DATE;` },
      { name: 'supplier_name', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);` },
      { name: 'warehouse_name', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(255) DEFAULT 'Main Warehouse';` },
      { name: 'warehouse_location', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(255);` },
      { name: 'inventory_notes', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS inventory_notes TEXT;` },
      { name: 'reserved_quantity', sql: `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS reserved_quantity INT DEFAULT 0;` },
    ];

    for (const col of columns) {
      await client.query(col.sql);
      console.log(`   ✅ ${col.name}`);
    }

    // 2. Create inventory_transactions table
    console.log('\nCreating inventory_transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN (
          'stock_added', 'stock_removed', 'stock_updated', 'reserved', 'released',
          'sold', 'transfer', 'order_cancelled', 'initial_stock', 'adjustment'
        )),
        previous_quantity INT NOT NULL DEFAULT 0,
        quantity_change INT NOT NULL DEFAULT 0,
        new_quantity INT NOT NULL DEFAULT 0,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ inventory_transactions table created');

    // 3. Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_sku ON marketplace_products(sku);
    `);
    console.log('   ✅ Indexes created');

    console.log('\n🎉 Inventory migration completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrateInventory();
