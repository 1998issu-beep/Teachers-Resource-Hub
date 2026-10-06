/* =========================================================
   TEACHER RESOURCE HUB — EDUCATION ARTICLE PAGE
   Complete article loader + comments + threaded replies
========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL =
    window.SUPABASE_URL || "https://brustfmxrxyvqdwwydag.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    window.SUPABASE_PUBLISHABLE_KEY ||
    window.SUPABASE_ANON_KEY ||
    "";

  let supabaseClient = window.supabaseClient || null;

  if (!supabaseClient && window.supabase && SUPABASE_PUBLISHABLE_KEY) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  }

  const articleContainer =
    document.getElementById("articleContent") ||
    document.getElementById("article") ||
    document.querySelector(".article-content") ||
    document.querySelector(".article-body");

  const commentsContainer =
    document.getElementById("commentsList") ||
    document.getElementById("comments") ||
    document.querySelector(".comments-list");

  const loadingElement =
    document.getElementById("articleLoading") ||
    document.querySelector(".article-loading");

  const errorElement =
    document.getElementById("articleError") ||
    document.querySelector(".article-error");

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showNotification(title, message, type) {
    document.querySelector(".trh-notification-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.className = "trh-notification-overlay";

    const accent = type === "error" ? "#dc2626" : "#6d28d9";
    const icon = type === "error" ? "!" : "✓";

    overlay.innerHTML = `
      <div class="trh-notification-card" role="dialog" aria-modal="true">
        <div class="trh-notification-header" style="background:${accent}">
          <div class="trh-notification-icon">${icon}</div>
          <strong>${escapeHTML(title)}</strong>
        </div>
        <div class="trh-notification-body">
          <p>${escapeHTML(message)}</p>
          <button type="button" class="trh-notification-close">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".trh-notification-close").onclick = () =>
      overlay.remove();

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.remove();
    });
  }

  function installNotificationStyles() {
    if (document.getElementById("trhArticleNotificationStyles")) return;

    const style = document.createElement("style");
    style.id = "trhArticleNotificationStyles";
    style.textContent = `
      .trh-notification-overlay{
        position:fixed;inset:0;z-index:99999;
        display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(25,10,45,.55);
        backdrop-filter:blur(6px);
      }
      .trh-notification-card{
        width:min(420px,100%);overflow:hidden;border-radius:24px;
        background:#fff;box-shadow:0 25px 70px rgba(40,10,70,.28);
        font-family:inherit;animation:trhPop .22s ease-out;
      }
      .trh-notification-header{
        color:#fff;padding:22px 24px;display:flex;
        align-items:center;gap:12px;font-size:19px;
      }
      .trh-notification-icon{
        width:36px;height:36px;border-radius:50%;
        display:grid;place-items:center;background:rgba(255,255,255,.2);
        font-weight:800;font-size:20px;
      }
      .trh-notification-body{padding:22px 24px 24px;color:#3f3748}
      .trh-notification-body p{margin:0 0 20px;line-height:1.6}
      .trh-notification-close{
        width:100%;border:0;border-radius:12px;padding:12px 16px;
        background:#6d28d9;color:#fff;font-weight:700;cursor:pointer;
      }
      @keyframes trhPop{
        from{opacity:0;transform:translateY(12px) scale(.97)}
        to{opacity:1;transform:translateY(0) scale(1)}
      }
      .trh-replies{margin:12px 0 0 24px;padding-left:16px;border-left:2px solid #eee6f8}
      .trh-reply-form{display:none;margin-top:12px}
      .trh-reply-form.active{display:block}
      .trh-reply-form textarea{
        width:100%;min-height:90px;box-sizing:border-box;
        border:1px solid #ddd3ea;border-radius:12px;padding:12px;
        resize:vertical;font:inherit;
      }
      .trh-reply-actions{display:flex;gap:8px;margin-top:8px}
      .trh-reply-actions button{
        border:0;border-radius:10px;padding:9px 14px;
        font-weight:700;cursor:pointer;
      }
      .trh-reply-submit{background:#6d28d9;color:#fff}
      .trh-reply-cancel{background:#f1edf5;color:#4b4254}
    `;
    document.head.appendChild(style);
  }

  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("slug") ||
      params.get("article") ||
      window.location.hash.replace(/^#/, "") ||
      ""
    );
  }

  function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function renderArticle(article) {
    document.title = `${article.title} | Teacher Resource Hub`;

    const title =
      document.getElementById("articleTitle") ||
      document.querySelector(".article-title, .article-head h1");

    const category =
      document.getElementById("articleCategory") ||
      document.querySelector(".article-category, .article-head .eyebrow");

    const date =
      document.getElementById("articleDate") ||
      document.querySelector(".article-date");

    if (title) title.textContent = article.title;
    if (category) category.textContent = article.category || "Education in Ghana";
    if (date) date.textContent = formatDate(article.published_at);

    const body =
      document.getElementById("articleBody") ||
      document.querySelector(".article-body");

    if (!body) return;

    let content = String(article.content || "");

    /* Older stored articles may contain literal \\n characters. */
    content = content.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

    const lines = content.split(/\n+/);
    body.innerHTML = lines
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        if (line.startsWith("### ")) {
          return `<h3>${escapeHTML(line.slice(4))}</h3>`;
        }
        if (line.startsWith("## ")) {
          return `<h2>${escapeHTML(line.slice(3))}</h2>`;
        }
        if (line.startsWith("# ")) {
          return `<h2>${escapeHTML(line.slice(2))}</h2>`;
        }
        return `<p>${escapeHTML(line)}</p>`;
      })
      .join("");

    if (loadingElement) loadingElement.style.display = "none";
  }

  async function loadArticle() {
    if (!supabaseClient) {
      throw new Error(
        "Supabase is not configured on this article page."
      );
    }

    const slug = getSlug();

    if (!slug) {
      throw new Error("No article slug was supplied.");
    }

    const { data, error } = await supabaseClient
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("This article could not be found.");

    renderArticle(data);
    await loadComments(slug);
  }

  function groupReplies(comments) {
    const topLevel = [];
    const replies = {};

    comments.forEach(comment => {
      if (comment.parent_id) {
        if (!replies[comment.parent_id]) replies[comment.parent_id] = [];
        replies[comment.parent_id].push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    return { topLevel, replies };
  }

  function renderComment(comment, replies) {
    const childReplies = replies[comment.id] || [];

    return `
      <article class="trh-comment" data-comment-id="${escapeHTML(comment.id)}">
        <div class="trh-comment-author">
          <strong>${escapeHTML(comment.author_name)}</strong>
          <span>${escapeHTML(formatDate(comment.created_at))}</span>
        </div>

        <div class="trh-comment-body">${escapeHTML(comment.body)}</div>

        <button
          type="button"
          class="trh-reply-toggle"
          data-reply-toggle="${escapeHTML(comment.id)}"
        >↩ Reply</button>

        <form
          class="trh-reply-form"
          data-reply-form="${escapeHTML(comment.id)}"
        >
          <textarea
            maxlength="2000"
            required
            placeholder="Write your reply..."
          ></textarea>
          <div class="trh-reply-actions">
            <button type="submit" class="trh-reply-submit">Post Reply</button>
            <button type="button" class="trh-reply-cancel">Cancel</button>
          </div>
        </form>

        ${
          childReplies.length
            ? `<div class="trh-replies">
                ${childReplies
                  .map(reply => renderReply(reply))
                  .join("")}
              </div>`
            : ""
        }
      </article>
    `;
  }

  function renderReply(reply) {
    return `
      <article class="trh-comment trh-comment-reply">
        <div class="trh-comment-author">
          <strong>${escapeHTML(reply.author_name)}</strong>
          <span>${escapeHTML(formatDate(reply.created_at))}</span>
        </div>
        <div class="trh-comment-body">${escapeHTML(reply.body)}</div>
      </article>
    `;
  }

  async function loadComments(slug) {
    if (!commentsContainer) return;

    const { data, error } = await supabaseClient
      .from("article_comments")
      .select(
        "id, article_slug, user_id, author_name, body, parent_id, created_at"
      )
      .eq("article_slug", slug)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments could not be loaded:", error);
      commentsContainer.innerHTML =
        `<p class="comments-empty">Comments could not be loaded right now.</p>`;
      return;
    }

    const comments = data || [];

    if (!comments.length) {
      commentsContainer.innerHTML =
        `<p class="comments-empty">Be the first to share your thoughts.</p>`;
      return;
    }

    const grouped = groupReplies(comments);

    commentsContainer.innerHTML = grouped.topLevel
      .map(comment => renderComment(comment, grouped.replies))
      .join("");

    bindReplyControls();
  }

  function bindReplyControls() {
    document.querySelectorAll("[data-reply-toggle]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.replyToggle;
        const form = document.querySelector(
          `[data-reply-form="${CSS.escape(id)}"]`
        );
        if (form) form.classList.toggle("active");
      });
    });

    document.querySelectorAll(".trh-reply-cancel").forEach(button => {
      button.addEventListener("click", () => {
        const form = button.closest(".trh-reply-form");
        if (form) form.classList.remove("active");
      });
    });

    document.querySelectorAll(".trh-reply-form").forEach(form => {
      form.addEventListener("submit", submitReply);
    });
  }

  async function submitReply(event) {
    event.preventDefault();

    if (!supabaseClient) return;

    const form = event.currentTarget;
    const parentId = form.dataset.replyForm;
    const textarea = form.querySelector("textarea");
    const body = textarea.value.trim();

    if (!body) return;

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
      showNotification(
        "Sign in required",
        "Please sign in to reply to this comment.",
        "error"
      );
      return;
    }

    let authorName = user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Teacher";

    const { error } = await supabaseClient
      .from("article_comments")
      .insert({
        article_slug: getSlug(),
        user_id: user.id,
        author_name: authorName,
        body,
        parent_id: parentId,
        status: "pending"
      });

    if (error) {
      console.error("Reply submission error:", error);
      showNotification(
        "Reply not posted",
        error.message || "Your reply could not be posted.",
        "error"
      );
      return;
    }

    textarea.value = "";
    form.classList.remove("active");

    showNotification(
      "Reply submitted",
      "Your reply has been received and is awaiting approval.",
      "success"
    );
  }

  function installCommentForm() {
    const form =
      document.getElementById("commentForm") ||
      document.querySelector(".comment-form form");

    if (!form) return;

    if (form.dataset.trhBound === "true") return;
    form.dataset.trhBound = "true";

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!supabaseClient) return;

      const textarea =
        form.querySelector("textarea") ||
        document.getElementById("commentBody");

      const body = textarea?.value.trim() || "";

      if (!body) return;

      const {
        data: { user }
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showNotification(
          "Sign in required",
          "Please sign in to comment on this article.",
          "error"
        );
        return;
      }

      const authorName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "Teacher";

      const { error } = await supabaseClient
        .from("article_comments")
        .insert({
          article_slug: getSlug(),
          user_id: user.id,
          author_name: authorName,
          body,
          parent_id: null,
          status: "pending"
        });

      if (error) {
        console.error("Comment submission error:", error);
        showNotification(
          "Comment not posted",
          error.message || "Your comment could not be posted.",
          "error"
        );
        return;
      }

      form.reset();

      showNotification(
        "Comment submitted",
        "Your comment has been received and is awaiting approval.",
        "success"
      );
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    installNotificationStyles();
    installCommentForm();

    try {
      await loadArticle();
    } catch (error) {
      console.error("Article loading error:", error);

      if (loadingElement) loadingElement.style.display = "none";

      if (errorElement) {
        errorElement.style.display = "block";
        errorElement.textContent =
          "We could not load this article right now. Please refresh and try again.";
      } else if (articleContainer) {
        articleContainer.innerHTML = `
          <div class="article-load-error">
            <h2>Article could not be loaded</h2>
            <p>Please refresh the page and try again.</p>
          </div>
        `;
      }
    }
  });
})();
