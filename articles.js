const articleList = document.getElementById("articleList");
document.getElementById("year").textContent = new Date().getFullYear();

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GH", {
    day:"numeric", month:"long", year:"numeric"
  }).format(new Date(value));
}

async function loadArticles() {
  const { data, error } = await educationSupabase
    .from("articles")
    .select("slug,title,category,excerpt,author_name,reading_time,published_at")
    .eq("status","published")
    .order("published_at",{ascending:false});

  if (error) {
    console.error(error);
    articleList.innerHTML = '<div class="edu-error">We could not load the articles right now. Please try again later.</div>';
    return;
  }

  if (!data || !data.length) {
    articleList.innerHTML = '<div class="edu-empty">No published articles yet. New education articles will appear here.</div>';
    return;
  }

  articleList.innerHTML = data.map(article => `
    <article class="edu-article-card">
      <div class="edu-card-top">
        <div class="edu-category">${escapeHTML(article.category)}</div>
        <h2 class="edu-card-title">${escapeHTML(article.title)}</h2>
        <p class="edu-excerpt">${escapeHTML(article.excerpt || "")}</p>
      </div>
      <div class="edu-card-bottom">
        <span class="edu-meta">
          By ${escapeHTML(article.author_name || "Teacher Resource Hub")}
          ${article.published_at ? " · " + escapeHTML(formatDate(article.published_at)) : ""}
          ${article.reading_time ? " · " + article.reading_time + " min read" : ""}
        </span>
        <a class="edu-read" href="article.html?slug=${encodeURIComponent(article.slug)}">Read article →</a>
      </div>
    </article>
  `).join("");
}

loadArticles();
