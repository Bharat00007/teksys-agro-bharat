import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function up() {
  console.log('Creating password_resets table...');
  const { error } = await supabase.rpc('execute_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_otp ON password_resets(otp);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('Table password_resets created successfully.');
  }
}

up().catch(console.error);
