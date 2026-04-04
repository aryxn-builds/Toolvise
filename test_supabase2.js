require('dotenv').config({path: '.env.local'}); 
const { createClient } = require('@supabase/supabase-js'); 
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); 
async function run() { 
  const { data } = await supabase.from('api_usage_logs').select('created_at').order('created_at', { ascending: false }).limit(5);
  console.log(data);
} 
run();
