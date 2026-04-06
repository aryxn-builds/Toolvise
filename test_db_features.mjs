import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://knllsocmydtpnttdcmsq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGxzb2NteWR0cG50dGRjbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDI0MzQsImV4cCI6MjA4OTk3ODQzNH0.Mwi910ZxoHBy8BVL5byK7uPHy7CHMQFAU4dLchbbHKA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const result = {};

  const { data: stacks, error: stErr } = await supabase.from("stacks").select("id, created_at, user_input, is_public").order("created_at", { ascending: false }).limit(5);
  result.stacks = { data: stacks, error: stErr };

  const { data: insStack, error: insErr } = await supabase.from("stacks").insert({
    share_slug: "test-slug-123",
    is_public: true,
    user_input: "test anon insert",
    skill_level: "Beginner",
    budget: "Free",
    goal: "Testing",
    build_style: "traditional"
  }).select();
  result.insertStack = { data: insStack, error: insErr };
  
  if (stacks && stacks.length > 0) {
    const stackId = stacks[0].id;
    const { data: comments, error: cErr } = await supabase.from("comments").select("*").eq("stack_id", stackId);
    result.fetchComments = { data: comments, error: cErr };

    const { data: insComment, error: countErr } = await supabase.from("comments").insert({
        stack_id: stackId,
        content: "Anon test comment"
    }).select();
    result.insertComment = { data: insComment, error: countErr };
  }
  
  fs.writeFileSync("db_test_output.json", JSON.stringify(result, null, 2));
}

test();
