import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from("stacks").select("*").limit(1);
  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    console.log("Stacks columns:", Object.keys(data[0]));
    console.log("Example:", data[0]);
  } else {
    console.log("No stacks found");
  }

  const { data: comments, error: cErr } = await supabase.from("comments").select("*").limit(1);
  if (cErr) {
    console.error("Comments error:", cErr);
  } else if (comments && comments.length > 0) {
    console.log("Comments columns:", Object.keys(comments[0]));
    console.log("Example:", comments[0]);
  } else {
    console.log("No comments found");
  }
}

check();
