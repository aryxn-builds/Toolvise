import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knllsocmydtpnttdcmsq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGxzb2NteWR0cG50dGRjbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDI0MzQsImV4cCI6MjA4OTk3ODQzNH0.Mwi910ZxoHBy8BVL5byK7uPHy7CHMQFAU4dLchbbHKA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Testing select...")
  const { data, error } = await supabase.from('api_usage_logs').select('*')
  console.log("Select result:", { data, error })
}
test()
