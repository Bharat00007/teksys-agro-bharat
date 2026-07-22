const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const queries = [
      'ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_latitude DOUBLE PRECISION;',
      'ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_longitude DOUBLE PRECISION;',
      'ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_address_readable TEXT;',
      'ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS pickup_landmark TEXT;',
      'ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS location_set_at TIMESTAMPTZ;',
      'ALTER TABLE pickup_requests ALTER COLUMN pickup_address DROP NOT NULL;',
      
      // Also reload the schema cache for PostgREST (Supabase API)
      'NOTIFY pgrst, \'reload schema\';'
    ];

    for (let q of queries) {
      await client.query(q);
      console.log('Executed:', q);
    }
    
    console.log('Migration and schema cache reload completed successfully!');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();
