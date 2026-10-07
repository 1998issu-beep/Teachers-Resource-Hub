/* =========================================================
   TEACHER RESOURCE HUB — EDUCATION IN GHANA CONFIG
   ========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL = "https://brustfmxrxyvqdwwydag.supabase.co";

  /*
   * PASTE YOUR SUPABASE PUBLISHABLE KEY BETWEEN THESE QUOTES.
   *
   * Example:
   * const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_....";
   */
  const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Teacher Resource Hub: Supabase library has not loaded.");
    return;
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY === "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
  ) {
    console.error("Teacher Resource Hub: Supabase Publishable Key has not been added.");
    return;
  }

  try {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;

    /*
     * This is the important part:
     * every Education-in-Ghana page uses the SAME global client.
     */
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    console.log("Teacher Resource Hub: Supabase connected.");
  } catch (error) {
    console.error("Teacher Resource Hub: Could not create Supabase client.", error);
  }
})();
