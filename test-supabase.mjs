import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knllsocmydtpnttdcmsq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGxzb2NteWR0cG50dGRjbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDI0MzQsImV4cCI6MjA4OTk3ODQzNH0.Mwi910ZxoHBy8BVL5byK7uPHy7CHMQFAU4dLchbbHKA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Testing insert...")
  const { data: insertData, error: insertError } = await supabase.from('api_usage_logs').insert([
    { provider: 'gemini', model: 'gemini-2.0-flash', duration_ms: 1000, success: true }
  ]).select()
  console.log("Insert result:", { insertData, insertError })
}
test()
