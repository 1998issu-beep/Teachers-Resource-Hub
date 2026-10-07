/* =========================================================
   TEACHER RESOURCE HUB — EDUCATION IN GHANA
   ARTICLES LIST
   ========================================================= */

(function () {
  "use strict";

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getArticlesContainer() {
    const selectors = [
      "#articlesList",
      "#articleList",
      "#articlesGrid",
      "#articleGrid",
      ".articles-list",
      ".article-list",
      ".articles-grid",
      ".article-grid"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    /*
     * Fallback for the current page if the container has a loading message
     * but no predictable ID/class.
     */
    const candidates = Array.from(document.querySelectorAll("div, section"));
    return candidates.find(el =>
      /Loading articles/i.test((el.textContent || "").trim())
    ) || null;
  }

  function showMessage(container, title, message, isError) {
    if (!container) return;

    container.innerHTML = `
      <div class="article-service-message ${isError ? "error" : ""}">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(message)}</p>
      </div>
    `;
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-GH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function createArticleCard(article) {
    const slug = encodeURIComponent(article.slug || "");
    const title = escapeHTML(article.title || "Untitled article");
    const category = escapeHTML(article.category || "Education");
    const excerpt = escapeHTML(
      article.excerpt ||
      (article.content || "").replace(/\s+/g, " ").slice(0, 180)
    );
    const author = escapeHTML(article.author_name || "Teacher Resource Hub");
    const date = formatDate(article.published_at || article.created_at);

    return `
      <article class="article-card">
        <div class="article-card-content">
          <div class="article-meta">
            <span>${category}</span>
            ${date ? `<span>${escapeHTML(date)}</span>` : ""}
          </div>

          <h3>
            <a href="article.html?slug=${slug}">
              ${title}
            </a>
          </h3>

          ${excerpt ? `<p>${excerpt}</p>` : ""}

          <div class="article-card-footer">
            <span>${author}</span>
            <a href="article.html?slug=${slug}" class="read-link">
              Read article →
            </a>
          </div>
        </div>
      </article>
    `;
  }

  async function loadArticles() {
    const container = getArticlesContainer();

    if (!container) {
      console.error(
        "Teacher Resource Hub: Could not find the Education in Ghana article container."
      );
      return;
    }

    const db = window.supabaseClient;

    if (!db) {
      showMessage(
        container,
        "Articles could not be loaded",
        "The Education in Ghana database connection is not ready. Please check education-config.js and refresh the page.",
        true
      );
      return;
    }

    try {
      const { data, error } = await db
        .from("articles")
        .select(
          "id,slug,title,category,excerpt,content,author_name,reading_time,featured_image,status,published_at,created_at"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Teacher Resource Hub article query error:", error);

        showMessage(
          container,
          "Unable to load articles",
          "The article service could not be connected. Please refresh the page.",
          true
        );
        return;
      }

      if (!data || data.length === 0) {
        showMessage(
          container,
          "No articles yet",
          "New Education in Ghana publications will appear here.",
          false
        );
        return;
      }

      container.innerHTML = data.map(createArticleCard).join("");
    } catch (error) {
      console.error("Teacher Resource Hub article loading error:", error);

      showMessage(
        container,
        "Unable to load articles",
        "Something went wrong while loading the articles. Please refresh the page.",
        true
      );
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadArticles();
  });

  window.loadTeacherResourceHubArticles = loadArticles;
})();
