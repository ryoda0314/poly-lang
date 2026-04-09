
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    // Try to insert a dummy memo with token_text to see if it fails
    // actually, select is safer.
    // Try to select token_text from awareness_memos
    const { data, error } = await supabase
        .from("awareness_memos")
        .select("token_text")
        .limit(1);

    if (error) {
        console.error("Column check failed:", error.message);
    } else {
        console.log("Column check success. Data:", data);
    }
}

checkColumn();
