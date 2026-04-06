import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://knllsocmydtpnttdcmsq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGxzb2NteWR0cG50dGRjbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDI0MzQsImV4cCI6MjA4OTk3ODQzNH0.Mwi910ZxoHBy8BVL5byK7uPHy7CHMQFAU4dLchbbHKA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreTest() {
  let query = supabase.from("stacks").select("*", { count: "exact" }).eq("is_public", true)
  query = query.order("created_at", { ascending: false }).range(0, 5)

  const { data, count, error } = await query
  
  fs.writeFileSync("explore_output.json", JSON.stringify({ data: data ? data.map(d => ({id: d.id, created: d.created_at, u: d.user_input, is_public: d.is_public})) : null, count, error }, null, 2))
}

exploreTest()
