import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function loadEnv() {
  const content = fs.readFileSync(".env.local", "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value.length > 0) {
      env[key.trim()] = value.join("=").trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking Comments System Configuration...");

  // 1. Check if tables exist by trying a SELECT
  const { data: comments, error: cErr } = await supabase
    .from("comments")
    .select("*")
    .limit(1);

  if (cErr) {
    console.error("❌ Comments table error:", cErr.message);
  } else {
    console.log("✅ Comments table is accessible (SELECT).");
  }

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);

  if (pErr) {
    console.error("❌ Profiles table error:", pErr.message);
  } else {
    console.log("✅ Profiles table is accessible (SELECT).");
  }

  // 2. Try an insert as ANON (Should fail with 42501)
  const { error: insErr } = await supabase
    .from("comments")
    .insert({
      content: "Diagnostic test",
      stack_id: "00000000-0000-0000-0000-000000000000" // Random ID
    });

  if (insErr?.code === "42501" || insErr?.message?.includes("policy")) {
    console.log("✅ RLS is blocking anonymous inserts (Expected).");
  } else if (insErr?.message?.includes("foreign key")) {
    console.log("✅ RLS passed but FK failed (Expected for random ID).");
  } else if (!insErr) {
    console.warn("⚠️ Anonymous insert SUCCEEDED! RLS might be too loose.");
  } else {
    console.log("ℹ️ Insert info:", insErr.message);
  }

  console.log("\nDiagnostic finished.");
}

check();
