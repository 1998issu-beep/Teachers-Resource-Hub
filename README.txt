TEACHER RESOURCE HUB — FULL RESTORE BUNDLE

This bundle contains the website code and the Paystack Edge Function we built.

FILES
1. index.html — current Teacher Resource Hub page structure, account modal, Supabase client, support/Facebook sections.
2. script.js — Paystack-enabled resource navigation/download logic. This version keeps the resource buttons visible even if Supabase resource loading is slow or temporarily fails.
3. resources.js — current 15 First Term scheme entries plus the two existing test lesson resources.
4. styles.css — complete compatible purple/white responsive stylesheet for the current index.html.
5. paystack-payment-index.ts — deployed Supabase Edge Function source for the GH₵20 term-unlock payment flow.

IMPORTANT
- Do NOT upload the TypeScript Edge Function into the GitHub website folder. It belongs in Supabase Edge Functions.
- Your Supabase PUBLISHABLE KEY belongs in index.html. Never put the Supabase SECRET/SERVICE ROLE key here.
- The website still uses the existing Supabase database, academic periods, request_resource_download RPC, and paystack-payment Edge Function.
- The public GitHub DOCX files are still directly reachable by filename; the final secure paywall requires moving files to private storage later.

RESTORE ORDER
1. Back up your current GitHub files first.
2. Replace index.html, script.js, resources.js and styles.css with the files in this bundle.
3. Make sure index.html contains your existing Supabase PUBLISHABLE KEY.
4. Keep your existing DOCX files in the same repository paths.
5. Do not change the Supabase SQL or Edge Function just for this restore.
6. Hard-refresh the website after uploading (or open it in a private/incognito tab).
