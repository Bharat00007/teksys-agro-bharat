import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    console.log('🔄 Updating product_requests status constraint...');
    await client.query(`ALTER TABLE product_requests DROP CONSTRAINT IF EXISTS product_requests_status_check;`);
    await client.query(`
      ALTER TABLE product_requests ADD CONSTRAINT product_requests_status_check
        CHECK (status IN ('pending','under_review','accepted','partially_fulfilled','ready_for_purchase','rejected','expired','completed','on_hold','cancelled'));
    `);
    console.log('✅ Constraint updated to include: completed, on_hold, cancelled\n');

    console.log('🎉 Migration complete!');
  } catch (err: any) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
