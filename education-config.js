/* =========================================================
   TEACHER RESOURCE HUB
   EDUCATION IN GHANA — SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = "https://brustfmxrxyvqdwwydag.supabase.co";

/*
   PASTE YOUR SUPABASE PUBLISHABLE KEY BETWEEN THE QUOTES BELOW.

   Do NOT use:
   - Supabase secret key
   - service_role key
   - PAYSTACK secret key
*/
const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

/*
   Make the configuration available to article.js.
*/
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;

if (
  window.supabase &&
  SUPABASE_PUBLISHABLE_KEY &&
  SUPABASE_PUBLISHABLE_KEY !== "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
) {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}
