import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Dropping existing constraint...');
    await client.query(`
      ALTER TABLE product_requests DROP CONSTRAINT IF EXISTS product_requests_status_check;
    `);

    console.log('Adding new constraint with on_hold and completed...');
    await client.query(`
      ALTER TABLE product_requests ADD CONSTRAINT product_requests_status_check
      CHECK (status IN ('pending', 'under_review', 'accepted', 'partially_fulfilled', 'ready_for_purchase', 'rejected', 'expired', 'completed', 'on_hold'));
    `);

    console.log('✅ Migration successful!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrateStatus();
