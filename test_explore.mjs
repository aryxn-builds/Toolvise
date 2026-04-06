import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: stacks, count, error } = await supabase
    .from('stacks')
    .select('*, profiles(display_name, avatar_url)', { count: 'exact' })
    .eq('is_public', true)
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Count:', count);
    console.log('Stacks count:', stacks.length);
    console.log('Authors:', stacks.map(s => s.profiles ? s.profiles.display_name : 'No Author'));
  }
}
run();
