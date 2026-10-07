const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const SITE_URL =
  "https://1998issu-beep.github.io/Teachers-Resource-Hub";

const shareDir = path.join(process.cwd(), "share");
const imageDir = path.join(
  process.cwd(),
  "images",
  "articles"
);

fs.mkdirSync(shareDir, { recursive: true });
fs.mkdirSync(imageDir, { recursive: true });

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getArticles() {
  const url =
    `${SUPABASE_URL}/rest/v1/articles` +
    `?select=slug,title,excerpt,category,author_name,featured_image` +
    `&status=eq.published`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `Supabase request failed: ${response.status}`
    );
  }

  return response.json();
}

function createSVG(article) {
  const title = escapeHTML(article.title);
  const excerpt = escapeHTML(article.excerpt || "");

  return `
<svg width="1200" height="630"
     xmlns="http://www.w3.org/2000/svg">

  <defs>
    <linearGradient id="bg"
      x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6d28d9"/>
      <stop offset="100%" stop-color="#4c1d95"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630"
        fill="#ffffff"/>

  <rect width="1200" height="105"
        fill="url(#bg)"/>

  <text x="65" y="65"
        font-family="Arial, sans-serif"
        font-size="27"
        font-weight="700"
        fill="white">
    TEACHER RESOURCE HUB
  </text>

  <rect x="65" y="145"
        width="1070"
        height="390"
        rx="28"
        fill="#faf7ff"
        stroke="#e9ddff"
        stroke-width="3"/>

  <text x="105" y="225"
        font-family="Arial, sans-serif"
        font-size="44"
        font-weight="700"
        fill="#241b35">
    ${title}
  </text>

  <foreignObject x="105" y="265"
                 width="990"
                 height="145">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="
           font-family:Arial,sans-serif;
           font-size:27px;
           line-height:1.45;
           color:#555;
         ">
      ${excerpt}
    </div>
  </foreignObject>

  <text x="105" y="475"
        font-family="Arial, sans-serif"
        font-size="22"
        font-weight="700"
        fill="#6d28d9">
    Education in Ghana • Teacher Resource Hub
  </text>

</svg>
`;
}

function createHTML(article, imageUrl) {
  const title = escapeHTML(article.title);
  const description = escapeHTML(
    article.excerpt ||
    "Read this article on Teacher Resource Hub."
  );

  const articleUrl =
    `${SITE_URL}/article.html?slug=${encodeURIComponent(article.slug)}`;

  const shareUrl =
    `${SITE_URL}/share/${article.slug}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<title>${title} | Teacher Resource Hub</title>

<meta name="description"
      content="${description}">

<meta property="og:type"
      content="article">

<meta property="og:title"
      content="${title}">

<meta property="og:description"
      content="${description}">

<meta property="og:image"
      content="${imageUrl}">

<meta property="og:url"
      content="${shareUrl}">

<meta property="og:site_name"
      content="Teacher Resource Hub">

<meta name="twitter:card"
      content="summary_large_image">

<meta name="twitter:title"
      content="${title}">

<meta name="twitter:description"
      content="${description}">

<meta name="twitter:image"
      content="${imageUrl}">

<link rel="canonical"
      href="${shareUrl}">

<meta http-equiv="refresh"
      content="0;url=${articleUrl}">

<script>
window.location.replace(${JSON.stringify(articleUrl)});
</script>

<style>
body {
  font-family: Arial, sans-serif;
  padding: 40px 20px;
  text-align: center;
  color: #241b35;
}
a {
  color: #6d28d9;
}
</style>

</head>

<body>

<h1>${title}</h1>

<p>${description}</p>

<p>
<a href="${articleUrl}">
Read the full article
</a>
</p>

</body>
</html>`;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase secrets are missing."
    );
  }

  const articles = await getArticles();

  console.log(
    `Found ${articles.length} published articles.`
  );

  for (const article of articles) {
    const slug =
      article.slug || slugify(article.title);

    const imageFile =
      path.join(imageDir, `${slug}.png`);

    const htmlFile =
      path.join(shareDir, `${slug}.html`);

    const imageUrl =
      `${SITE_URL}/images/articles/${slug}.png`;

    const svg = createSVG(article);

    await sharp(Buffer.from(svg))
      .png()
      .resize(1200, 630)
      .toFile(imageFile);

    fs.writeFileSync(
      htmlFile,
      createHTML(article, imageUrl),
      "utf8"
    );

    console.log(`Generated: ${slug}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
