TEACHER RESOURCE HUB — FINAL REBUILD BUNDLE
============================================

This is a clean rebuild of the working Teacher Resource Hub code, with the
payment/authentication path rebuilt rather than repeatedly patching the old
implementation.

PROJECT
-------
GitHub site:
https://1998issu-beep.github.io/Teachers-Resource-Hub/

Supabase project:
https://brustfmxrxyvqdwwydag.supabase.co

PAYMENT MODEL
-------------
• 2 free downloads per term.
• The third different resource in that term requires GH₵20.
• GH₵20 unlocks the selected academic term.
• The existing 2026/2027 academic-period names are preserved.

WHAT WAS PRESERVED
------------------
• Existing purple/white website design.
• Basic 1–9 navigation.
• Primary subjects and JHS subjects.
• Existing resources.js structure and resource names.
• Existing account sign-up/sign-in flow.
• Existing request_resource_download RPC concept.
• Existing 2-free-download rule.
• Existing Paystack amount of GH₵20 (2000 GHS subunits).
• Existing Supabase project URL.
• Existing GitHub Pages site URL.

WHAT WAS REBUILT
----------------
1. script.js now obtains a reliable Supabase session before payment calls.
2. Payment requests use a direct HTTPS request with the current user JWT and
   Supabase publishable key, instead of depending on the previous functions.invoke
   authentication path.
3. paystack-payment uses the current Supabase withSupabase({ auth: 'user' })
   pattern. Supabase handles CORS/preflight for the function.
4. Payment verification checks the Paystack reference, amount, currency,
   authenticated user, payment record and academic period before granting access.
5. Access-pass creation uses an upsert and the database hardening SQL adds the
   required unique constraint.
6. The download RPC is concurrency-safe for the 2-free-download limit.
7. A separate paystack-webhook function is included for server-side payment
   confirmation. Paystack recommends webhooks for reliable fulfilment.
8. A resource-download function is included for the eventual private-storage
   paywall. It is NOT enabled by the current website yet, so existing GitHub
   downloads are not broken by this rebuild.

IMPORTANT SECURITY NOTE
-----------------------
The actual Supabase publishable key is intentionally NOT included in this bundle.
Keep the publishable key already present in your working index.html and put that
same key into the new index.html before uploading it to GitHub.

NEVER put the PAYSTACK_SECRET_KEY, Supabase secret key, or service-role key in
GitHub, index.html, script.js, resources.js, or any browser-visible file.

The PAYSTACK_SECRET_KEY remains a Supabase Edge Function secret.

FILES
-----
index.html
script.js
styles.css
resources.js

supabase/functions/paystack-payment/index.ts
supabase/functions/paystack-webhook/index.ts
supabase/functions/resource-download/index.ts

supabase/sql/DATABASE_HARDENING.sql
supabase/sql/STORAGE_BUCKET_SETUP.sql

DEPLOYMENT ORDER
----------------
A. GITHUB PAGES
1. Back up the current repository files.
2. Replace index.html, script.js, styles.css and resources.js with the files
   in this bundle.
3. BEFORE uploading index.html, preserve the real Supabase publishable key from
   your currently working index.html. Do not replace it with the placeholder.
4. Keep all existing DOCX files exactly where they are.
5. Do not connect or change GitHub integration inside Supabase. It is not required
   for Dashboard-deployed Edge Functions.

B. SUPABASE DATABASE
1. Open SQL Editor.
2. Run supabase/sql/DATABASE_HARDENING.sql.
3. If the unique-index statements report existing duplicate rows, stop and send
   the exact error before deleting anything. Do not guess.

C. SUPABASE EDGE FUNCTION — PAYMENT
1. Open Edge Functions.
2. Open the existing function named paystack-payment.
3. Replace its source with:
   supabase/functions/paystack-payment/index.ts
4. Deploy.
5. Confirm the existing secret named PAYSTACK_SECRET_KEY is still present.
6. Do not paste the secret into any website file.

D. SUPABASE EDGE FUNCTION — WEBHOOK (RECOMMENDED)
1. Create a new Edge Function named paystack-webhook.
2. Paste:
   supabase/functions/paystack-webhook/index.ts
3. Deploy it.
4. Because this is a public Paystack webhook, JWT verification must be disabled for this function. The included supabase/config.toml has `verify_jwt = false` for paystack-webhook. If you deploy from the Dashboard, use the function's JWT verification setting to turn it off.
5. Paystack webhook URL:
   https://brustfmxrxyvqdwwydag.supabase.co/functions/v1/paystack-webhook
6. Configure that URL in Paystack Developers → Webhooks in the same environment
   you are testing (Test mode for now).
7. The webhook verifies x-paystack-signature before processing charge.success.

E. OPTIONAL PRIVATE FILE STORAGE (FINAL PAYWALL SECURITY)
The current website still downloads the existing public GitHub DOCX files so that
nothing breaks during this rebuild. That means direct GitHub URLs are still
public if somebody knows a filename.

When you are ready for a genuinely protected paywall:
1. Run supabase/sql/STORAGE_BUCKET_SETUP.sql.
2. Upload the DOCX resources to the private bucket named teacher-resources.
3. Keep resources.file_path equal to the corresponding storage path.
4. Deploy resource-download/index.ts.
5. Then switch the website download handler to use that function instead of the
   GitHub file URL.

The resource-download function already performs the existing download-access RPC
and creates a short-lived signed URL from the private bucket.

TEST CHECKLIST
--------------
1. Open the site in a private/incognito browser window.
2. Create/sign in to a teacher account.
3. Download resource 1: it should work.
4. Download resource 2: it should work.
5. Click a different resource: the GH₵20 unlock prompt should appear.
6. Continue to Paystack.
7. Complete a Paystack TEST payment.
8. Return to the site.
9. The selected term should become unlocked.
10. A further resource in that term should download without consuming another
    free-download slot.

WHY THIS VERSION IS DIFFERENT
-----------------------------
The previous failure happened at the boundary between the browser session and
Edge Function authentication. This rebuild does not rely on the previous
functions.invoke authentication path for payment calls. It obtains the current
user JWT first and sends it explicitly in the Authorization header. The Edge
Function itself uses Supabase's current authenticated-user wrapper.

Do not replace working code again unless a specific test fails. Test this bundle
in the order above and use the first exact error message/log if something fails.
