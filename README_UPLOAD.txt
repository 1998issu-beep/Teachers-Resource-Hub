TEACHER RESOURCE HUB — EDUCATION IN GHANA
=============================================

This package adds the new Education in Ghana section while leaving the existing
resource library, download system, authentication, Paystack payment system and
Supabase Edge Functions untouched.

UPLOAD THESE FILES TO THE ROOT OF THE GITHUB REPOSITORY:
1. index.html              (updated homepage)
2. education-config.js     (Supabase public configuration)
3. education.css
4. articles.html
5. articles.js
6. article.html
7. article.js

IMPORTANT
- Do NOT delete resources.js, script.js, styles.css, or any existing Supabase/
  payment files.
- education-config.js contains ONLY the Supabase URL and PUBLIC/PUBLISHABLE key.
- NEVER place SUPABASE_SECRET_KEY, service-role keys, or PAYSTACK_SECRET_KEY
  in any frontend file.

WHAT THIS ADDS
- "Education in Ghana" in the desktop and mobile navigation.
- A matching Education in Ghana feature section on the homepage.
- /articles.html: published article listing.
- /article.html?slug=...: individual article pages.
- Reader Discussion below each article.
- Signed-in readers can submit comments.
- New comments start as "pending" and require approval in Supabase.
- Approved comments are visible to everyone.
- Existing article table and article_comments table are used; no new database
  tables are required.

FIRST ARTICLE
The already-published article with slug:
why-ghanaian-teachers-need-better-access-to-teaching-resources

After uploading the files, open:
https://YOUR-GITHUB-PAGES-SITE/articles.html

Then open the article to test the Reader Discussion.

NOTE
The current comment RLS setup allows public viewing of approved comments and
authenticated users to insert/update/delete their own comments. There is not
yet a public moderation interface; approve comments from Supabase Table Editor
or SQL as the site owner.
