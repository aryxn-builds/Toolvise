const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'stacks' });
  
  if (error) {
    // If RPC doesn't exist, try raw SQL if possible, or just list properties of a retrieved row
    console.log('RPC failed, trying to retrieve a row to inspect properties...');
    const { data: rowData, error: rowError } = await supabase.from('stacks').select('*').limit(1).single();
    if (rowData) {
      console.log('Columns in stacks table:', Object.keys(rowData));
    } else {
      console.error('Failed to retrieve columns:', rowError);
    }
  } else {
    console.log('Columns info:', data);
  }
}

checkColumns();
