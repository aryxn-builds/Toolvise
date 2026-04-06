import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://knllsocmydtpnttdcmsq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGxzb2NteWR0cG50dGRjbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDI0MzQsImV4cCI6MjA4OTk3ODQzNH0.Mwi910ZxoHBy8BVL5byK7uPHy7CHMQFAU4dLchbbHKA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndComment() {
  const result = {};

  // 1. Sign up a dummy user
  const email = "test_user_toolvise_" + Date.now() + "@gmail.com";
  const password = "Password123!";
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password
  });
  
  result.authData = authData;
  result.authErr = authErr;

  if (authData?.user) {
    // 2. Fetch a valid stack ID
    const { data: stacks } = await supabase.from("stacks").select("id").limit(1);
    if (stacks && stacks.length > 0) {
      const stackId = stacks[0].id;
      
      // 3. Try to insert comment
      const { data: comment, error: commentErr } = await supabase.from("comments").insert({
        stack_id: stackId,
        user_id: authData.user.id,
        content: "Hello this is a test comment from authenticated user!"
      }).select();
      
      result.comment = comment;
      result.commentErr = commentErr;
    }
  }

  fs.writeFileSync("auth_test_output.json", JSON.stringify(result, null, 2));
}

testAuthAndComment();
