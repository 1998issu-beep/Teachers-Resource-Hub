/* Teacher Resource Hub — Education in Ghana
   This file contains only the Supabase URL and PUBLIC/PUBLISHABLE key.
   Never place a Supabase secret/service-role key here. */

const EDUCATION_SUPABASE_URL = "https://brustfmxrxyvqdwwydag.supabase.co";
const EDUCATION_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_yqmL_JtCm_-vqpwfzyZV3Q_ABtVsLF3";

const educationSupabase = window.supabase.createClient(
  EDUCATION_SUPABASE_URL,
  EDUCATION_SUPABASE_PUBLISHABLE_KEY
);
