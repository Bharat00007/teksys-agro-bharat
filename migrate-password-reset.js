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
      `CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_password_resets_otp ON password_resets(otp);`,
      `NOTIFY pgrst, 'reload schema';`
    ];

    for (let q of queries) {
      await client.query(q);
      console.log('Executed query successfully.');
    }
    
    console.log('Migration and schema cache reload completed successfully!');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();
