import { supabase } from './src/config/supabase';

async function test() {
  const { data: user } = await supabase.from('users').select('id').limit(1).single();
  if (!user) {
    console.log('No user found');
    return;
  }
  const { data, error } = await supabase
    .from('product_requests')
    .insert({
      customer_id: user.id,
      requested_product_name: 'Test Request',
      requested_quantity: 10,
      unit: 'kg',
      status: 'pending',
    })
    .select()
    .single();

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
