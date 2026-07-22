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
      'ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS otp VARCHAR(4);',
      'NOTIFY pgrst, \'reload schema\';'
    ];

    for (let q of queries) {
      await client.query(q);
      console.log('Executed:', q);
    }
    
    console.log('OTP Migration and schema cache reload completed successfully!');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();
