/* =========================================================
   TEACHER RESOURCE HUB
   EDUCATION IN GHANA — ARTICLE PAGE
========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL = "https://brustfmxrxyvqdwwydag.supabase.co";

  /*
     Supabase configuration can come from education-config.js.
     We deliberately support BOTH:
       1. window.supabaseClient / window.SUPABASE_PUBLISHABLE_KEY
       2. normal top-level const/let variables from education-config.js
  */
  let db = null;

  try {
    if (typeof supabaseClient !== "undefined") {
      db = supabaseClient;
    }
  } catch (_) {}

  if (!db && window.supabaseClient) {
    db = window.supabaseClient;
  }

  let publishableKey = null;

  try {
    if (typeof SUPABASE_PUBLISHABLE_KEY !== "undefined") {
      publishableKey = SUPABASE_PUBLISHABLE_KEY;
    }
  } catch (_) {}

  if (!publishableKey) {
    publishableKey = window.SUPABASE_PUBLISHABLE_KEY || window.SUPABASE_ANON_KEY || null;
  }

  if (!db && window.supabase && publishableKey) {
    db = window.supabase.createClient(
      SUPABASE_URL,
      publishableKey
    );
  }

  let articleContainer;
  let commentsList;
  let commentInput;
  let commentSubmit;

  function getArticleSlug() {
    const params = new URLSearchParams(window.location.search);
    let slug = params.get("slug") || params.get("article");

    if (!slug && window.location.hash) {
      slug = window.location.hash.replace(/^#/, "").trim();
    }

    return slug;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatArticleContent(content) {
    if (!content) return "";

    content = String(content)
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\r\n/g, "\n");

    const lines = content.split("\n");
    let html = "";
    let paragraph = [];

    function flushParagraph() {
      if (!paragraph.length) return;

      const text = paragraph.join(" ").trim();

      if (text) {
        html += `<p>${escapeHTML(text)}</p>`;
      }

      paragraph = [];
    }

    lines.forEach(function (rawLine) {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        return;
      }

      if (line.startsWith("### ")) {
        flushParagraph();
        html += `<h3>${escapeHTML(line.substring(4))}</h3>`;
        return;
      }

      if (line.startsWith("## ")) {
        flushParagraph();
        html += `<h2>${escapeHTML(line.substring(3))}</h2>`;
        return;
      }

      if (line.startsWith("# ")) {
        flushParagraph();
        html += `<h2>${escapeHTML(line.substring(2))}</h2>`;
        return;
      }

      paragraph.push(line);
    });

    flushParagraph();
    return html;
  }

  function showNotification(title, message, success = true) {
    const modal = document.getElementById("notificationModal");
    const titleEl = document.getElementById("notificationTitle");
    const messageEl = document.getElementById("notificationMessage");
    const icon = document.getElementById("notificationIcon");

    if (!modal) {
      alert(message);
      return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    icon.textContent = success ? "✓" : "!";

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeNotification() {
    const modal = document.getElementById("notificationModal");

    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  async function loadArticle() {
    articleContainer = document.getElementById("articleContent");

    if (!articleContainer) return;

    const slug = getArticleSlug();

    if (!slug) {
      articleContainer.innerHTML = `
        <div class="article-error">
          <h2>Article not found</h2>
          <p>No article was specified.</p>
        </div>
      `;
      return;
    }

    if (!db) {
      articleContainer.innerHTML = `
        <div class="article-error">
          <h2>Unable to load article</h2>
          <p>
            The article service could not be connected.
            Please refresh the page.
          </p>
        </div>
      `;

      console.error(
        "Teacher Resource Hub: Supabase client not available."
      );

      return;
    }

    try {
      const result = await db
        .from("articles")
        .select(`
          id,
          slug,
          title,
          category,
          excerpt,
          content,
          author_name,
          reading_time,
          featured_image,
          status,
          published_at
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (result.error) {
        console.error("Article query error:", result.error);
        throw result.error;
      }

      const article = result.data;

      if (!article) {
        articleContainer.innerHTML = `
          <div class="article-error">
            <h2>Article not found</h2>
            <p>
              This article may have been removed
              or is not currently published.
            </p>
          </div>
        `;
        return;
      }

      document.title = `${article.title} | Education in Ghana`;

      let imageHTML = "";

      if (article.featured_image) {
        imageHTML = `
          <img
            class="article-featured-image"
            src="${escapeHTML(article.featured_image)}"
            alt="${escapeHTML(article.title)}"
          >
        `;
      }

      articleContainer.innerHTML = `
        <header class="article-header">
          <div class="article-category">
            ${escapeHTML(article.category)}
          </div>

          <h1>${escapeHTML(article.title)}</h1>

          ${
            article.excerpt
              ? `<p class="article-excerpt">
                   ${escapeHTML(article.excerpt)}
                 </p>`
              : ""
          }

          <div class="article-meta">
            <span>
              By ${escapeHTML(
                article.author_name || "Teacher Resource Hub"
              )}
            </span>

            ${
              article.reading_time
                ? `<span>•</span>
                   <span>${escapeHTML(
                     article.reading_time
                   )} min read</span>`
                : ""
            }
          </div>
        </header>

        ${imageHTML}

        <div class="article-body">
          ${formatArticleContent(article.content)}
        </div>
      `;

      await loadComments(slug);
    } catch (error) {
      console.error("Article loading failed:", error);

      articleContainer.innerHTML = `
        <div class="article-error">
          <h2>Unable to load article</h2>
          <p>
            Something went wrong while loading this article.
            Please refresh the page and try again.
          </p>
        </div>
      `;
    }
  }

  async function loadComments(slug) {
    commentsList = document.getElementById("commentsList");

    if (!commentsList || !db) return;

    try {
      const result = await db
        .from("article_comments")
        .select(`
          id,
          article_slug,
          user_id,
          author_name,
          body,
          parent_id,
          created_at,
          status
        `)
        .eq("article_slug", slug)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (result.error) {
        console.error("Comments error:", result.error);

        commentsList.innerHTML = `
          <p class="comments-error">
            Comments could not be loaded.
          </p>
        `;
        return;
      }

      renderComments(result.data || []);
    } catch (error) {
      console.error("Comment loading error:", error);

      commentsList.innerHTML = `
        <p class="comments-error">
          Comments could not be loaded.
        </p>
      `;
    }
  }

  function renderComments(comments) {
    if (!comments.length) {
      commentsList.innerHTML = `
        <div class="no-comments">
          <p>
            No approved comments yet.
            Be the first to start the discussion.
          </p>
        </div>
      `;
      return;
    }

    const topLevel = comments.filter(
      comment => !comment.parent_id
    );

    commentsList.innerHTML = topLevel
      .map(comment => renderComment(comment, comments))
      .join("");
  }

  function renderComment(comment, allComments) {
    const replies = allComments.filter(
      reply => reply.parent_id === comment.id
    );

    return `
      <div
        class="comment-card"
        data-comment-id="${comment.id}"
      >
        <div class="comment-author">
          ${escapeHTML(comment.author_name)}
        </div>

        <div class="comment-date">
          ${formatDate(comment.created_at)}
        </div>

        <div class="comment-body">
          ${escapeHTML(comment.body)}
        </div>

        <button
          type="button"
          class="reply-button"
          data-reply-id="${comment.id}"
        >
          ↩ Reply
        </button>

        <div
          class="reply-form"
          id="reply-form-${comment.id}"
          hidden
        >
          <textarea
            id="reply-input-${comment.id}"
            maxlength="2000"
            placeholder="Write your reply..."
          ></textarea>

          <div class="reply-actions">
            <button
              type="button"
              class="reply-cancel"
              data-cancel-id="${comment.id}"
            >
              Cancel
            </button>

            <button
              type="button"
              class="reply-submit"
              data-parent-id="${comment.id}"
            >
              Post Reply
            </button>
          </div>
        </div>

        ${
          replies.length
            ? `
              <div class="comment-replies">
                ${replies.map(reply => `
                  <div class="reply-card">
                    <div class="comment-author">
                      ${escapeHTML(reply.author_name)}
                    </div>

                    <div class="comment-date">
                      ${formatDate(reply.created_at)}
                    </div>

                    <div class="comment-body">
                      ${escapeHTML(reply.body)}
                    </div>
                  </div>
                `).join("")}
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  function formatDate(date) {
    if (!date) return "";

    try {
      return new Date(date).toLocaleDateString(
        "en-GH",
        {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
      );
    } catch {
      return "";
    }
  }

  async function getCurrentUser() {
    if (!db) return null;

    const result = await db.auth.getUser();

    if (result.error) return null;

    return result.data?.user || null;
  }

  async function getAuthorName(user) {
    if (!user) return "Teacher";

    try {
      const result = await db
        .from("teacher_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      if (!result.error && result.data) {
        return (
          result.data.full_name ||
          result.data.email ||
          user.email ||
          "Teacher"
        );
      }
    } catch (error) {
      console.warn(
        "Could not load teacher profile:",
        error
      );
    }

    return user.email || "Teacher";
  }

  async function submitComment() {
    if (!db) {
      showNotification(
        "Comment not posted",
        "The discussion service is not connected.",
        false
      );
      return;
    }

    const body = commentInput.value.trim();

    if (!body) {
      showNotification(
        "Comment not posted",
        "Please write a comment first.",
        false
      );
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      showNotification(
        "Sign in required",
        "Please sign in before posting a comment.",
        false
      );
      return;
    }

    const slug = getArticleSlug();
    const authorName = await getAuthorName(user);

    commentSubmit.disabled = true;
    commentSubmit.textContent = "Posting…";

    try {
      const result = await db
        .from("article_comments")
        .insert({
          article_slug: slug,
          user_id: user.id,
          author_name: authorName,
          body: body,
          parent_id: null,
          status: "pending"
        });

      if (result.error) throw result.error;

      commentInput.value = "";

      showNotification(
        "Comment submitted",
        "Your comment has been received and is awaiting approval.",
        true
      );
    } catch (error) {
      console.error(
        "Comment submission error:",
        error
      );

      showNotification(
        "Comment not posted",
        "We could not submit your comment. Please try again.",
        false
      );
    } finally {
      commentSubmit.disabled = false;
      commentSubmit.textContent = "Post Comment";
    }
  }

  async function submitReply(parentId) {
    if (!db) return;

    const input = document.getElementById(
      `reply-input-${parentId}`
    );

    if (!input) return;

    const body = input.value.trim();

    if (!body) {
      showNotification(
        "Reply not posted",
        "Please write a reply first.",
        false
      );
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      showNotification(
        "Sign in required",
        "Please sign in before replying.",
        false
      );
      return;
    }

    const slug = getArticleSlug();
    const authorName = await getAuthorName(user);

    const button = document.querySelector(
      `.reply-submit[data-parent-id="${parentId}"]`
    );

    if (button) {
      button.disabled = true;
      button.textContent = "Posting…";
    }

    try {
      const result = await db
        .from("article_comments")
        .insert({
          article_slug: slug,
          user_id: user.id,
          author_name: authorName,
          body: body,
          parent_id: parentId,
          status: "pending"
        });

      if (result.error) throw result.error;

      input.value = "";

      const form = document.getElementById(
        `reply-form-${parentId}`
      );

      if (form) form.hidden = true;

      showNotification(
        "Reply submitted",
        "Your reply has been received and is awaiting approval.",
        true
      );
    } catch (error) {
      console.error(
        "Reply submission error:",
        error
      );

      showNotification(
        "Reply not posted",
        "We could not submit your reply. Please try again.",
        false
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Post Reply";
      }
    }
  }

  function setupEvents() {
    commentInput = document.getElementById("commentInput");
    commentSubmit = document.getElementById("commentSubmit");

    if (commentSubmit) {
      commentSubmit.addEventListener(
        "click",
        submitComment
      );
    }

    document.addEventListener("click", function (event) {
      const replyButton =
        event.target.closest(".reply-button");

      if (replyButton) {
        const id = replyButton.dataset.replyId;
        const form = document.getElementById(
          `reply-form-${id}`
        );

        if (form) form.hidden = !form.hidden;

        return;
      }

      const cancelButton =
        event.target.closest(".reply-cancel");

      if (cancelButton) {
        const id = cancelButton.dataset.cancelId;
        const form = document.getElementById(
          `reply-form-${id}`
        );

        if (form) form.hidden = true;

        return;
      }

      const submitReplyButton =
        event.target.closest(".reply-submit");

      if (submitReplyButton) {
        submitReply(
          submitReplyButton.dataset.parentId
        );
      }
    });

    const notificationClose =
      document.getElementById("notificationClose");

    if (notificationClose) {
      notificationClose.addEventListener(
        "click",
        closeNotification
      );
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      setupEvents();
      loadArticle();
    }
  );

})();
/* =========================================================
   ARTICLE SHARING
========================================================= */

function initializeArticleSharing() {
  const whatsappButton = document.getElementById("shareWhatsApp");
  const facebookButton = document.getElementById("shareFacebook");
  const copyButton = document.getElementById("shareCopy");
  const nativeButton = document.getElementById("shareNative");
  const status = document.getElementById("shareStatus");

  if (
    !whatsappButton &&
    !facebookButton &&
    !copyButton &&
    !nativeButton
  ) {
    return;
  }

  const articleUrl = window.location.href;
  const articleTitle =
    document.querySelector(".article-title")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    document.title;

  const shareText =
    articleTitle + "\n\nRead it on Teacher Resource Hub:";

  function showShareStatus(message) {
    if (!status) return;

    status.textContent = message;

    clearTimeout(window.__trhShareStatusTimer);

    window.__trhShareStatusTimer = setTimeout(function () {
      status.textContent = "";
    }, 3000);
  }

  /* WhatsApp */
  if (whatsappButton) {
    whatsappButton.addEventListener("click", function () {
      const whatsappUrl =
        "https://wa.me/?text=" +
        encodeURIComponent(shareText + "\n" + articleUrl);

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  /* Facebook */
  if (facebookButton) {
    facebookButton.addEventListener("click", function () {
      const facebookUrl =
        "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(articleUrl);

      window.open(
        facebookUrl,
        "_blank",
        "width=700,height=600,noopener,noreferrer"
      );
    });
  }

  /* Copy link */
  if (copyButton) {
    copyButton.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(articleUrl);

        showShareStatus("Article link copied successfully.");
      } catch (error) {
        /* Fallback for browsers where Clipboard API is unavailable */

        const textarea = document.createElement("textarea");
        textarea.value = articleUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
          document.execCommand("copy");
          showShareStatus("Article link copied successfully.");
        } catch (copyError) {
          showShareStatus(
            "Unable to copy automatically. Please copy the link manually."
          );
        }

        textarea.remove();
      }
    });
  }

  /* Native Android / device sharing */
  if (nativeButton) {
    if (!navigator.share) {
      nativeButton.style.display = "none";
    } else {
      nativeButton.addEventListener("click", async function () {
        try {
          await navigator.share({
            title: articleTitle,
            text: shareText,
            url: articleUrl
          });
        } catch (error) {
          /* User cancelling the native share window is normal. */
          if (error && error.name !== "AbortError") {
            console.error(
              "Native sharing failed:",
              error
            );
          }
        }
      });
    }
  }
}


/* Start sharing after the article page is ready */
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeArticleSharing
  );
} else {
  initializeArticleSharing();
}
