require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  console.log('Attempting to insert test stack as ANON...');
  const testSlug = 'test-stack-' + Date.now();
  
  const { data, error } = await supabase.from('stacks').insert({
    share_slug: testSlug,
    user_input: 'Test input from script',
    is_public: true,
    summary: 'Test summary'
  }).select('id').single();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert successful! ID:', data.id);
    
    // Now verify it's visible in public SELECT
    const { data: fetchResult, error: fetchError } = await supabase
      .from('stacks')
      .select('*')
      .eq('id', data.id)
      .single();
      
    if (fetchError) {
      console.error('Fetch failed:', fetchError);
    } else {
      console.log('Successfully verified visibility of NEW stack.');
      
      // Cleanup
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
        await adminSupabase.from('stacks').delete().eq('id', data.id);
        console.log('Cleaned up test stack.');
      }
    }
  }
}

testInsert();
