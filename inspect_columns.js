require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspect() {
  const { data, error } = await supabase
    .from('stacks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching stack:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in stacks table:');
    console.log(JSON.stringify(Object.keys(data[0]), null, 2));
  } else {
    console.log('No stacks found in table to inspect column names.');
  }
}

inspect();
