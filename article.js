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
    const titleEl = document.getElementById("notificationTitle");
    const requiresLogin =
      titleEl && titleEl.textContent.trim() === "Sign in required";

    if (modal) {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }

    if (requiresLogin) {
      window.location.href =
        "https://1998issu-beep.github.io/Teachers-Resource-Hub/?account=login";
    }
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

  async function isCurrentUserAdmin() {
    try {
      const { data, error } = await db.rpc("is_current_user_admin");
      if (error) {
        console.warn("Could not verify administrator status:", error);
        return false;
      }
      return data === true;
    } catch (error) {
      console.warn("Could not verify administrator status:", error);
      return false;
    }
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
      const isAdmin = await isCurrentUserAdmin();
      const result = await db
        .from("article_comments")
        .insert({
          article_slug: slug,
          user_id: user.id,
          author_name: authorName,
          body: body,
          parent_id: null,
          status: isAdmin ? "approved" : "pending"
        });

      if (result.error) throw result.error;

      commentInput.value = "";

      showNotification(
        isAdmin ? "Comment published" : "Comment submitted",
        isAdmin
          ? "Your comment has been published without requiring approval."
          : "Your comment has been received and is awaiting approval.",
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
      const isAdmin = await isCurrentUserAdmin();
      const result = await db
        .from("article_comments")
        .insert({
          article_slug: slug,
          user_id: user.id,
          author_name: authorName,
          body: body,
          parent_id: parentId,
          status: isAdmin ? "approved" : "pending"
        });

      if (result.error) throw result.error;

      input.value = "";

      const form = document.getElementById(
        `reply-form-${parentId}`
      );

      if (form) form.hidden = true;

      showNotification(
        isAdmin ? "Reply published" : "Reply submitted",
        isAdmin
          ? "Your reply has been published without requiring approval."
          : "Your reply has been received and is awaiting approval.",
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
   Shares a static social-preview page so Facebook/WhatsApp
   can read real Open Graph metadata and display an image.
========================================================= */

(function () {
  "use strict";

  const SHARE_BASE_URL =
    "https://1998issu-beep.github.io/Teachers-Resource-Hub/share/";

  function getArticleSlugForSharing() {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("slug") ||
      params.get("article") ||
      (window.location.hash
        ? window.location.hash.replace(/^#/, "").trim()
        : "")
    );
  }

  function getArticleShareTitle() {
    const titleElement =
      document.querySelector(".article-header h1") ||
      document.querySelector(".article-title") ||
      document.querySelector("#articleContent h1") ||
      document.querySelector("h1");

    return (
      titleElement?.textContent?.trim() ||
      document.title ||
      "Teacher Resource Hub"
    );
  }

  function getShareUrl() {
    const slug = getArticleSlugForSharing();
    return slug
      ? SHARE_BASE_URL + encodeURIComponent(slug) + ".html"
      : window.location.href;
  }

  function showShareStatus(message) {
    const status = document.getElementById("shareStatus");
    if (!status) return;

    status.textContent = message;
    clearTimeout(window.__trhShareStatusTimer);
    window.__trhShareStatusTimer = setTimeout(function () {
      status.textContent = "";
    }, 3000);
  }

  async function copyArticleLink(url) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showShareStatus("Article link copied successfully.");
        return;
      }
    } catch (error) {
      console.warn("Clipboard API unavailable:", error);
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      showShareStatus(
        copied
          ? "Article link copied successfully."
          : "Please copy the article link manually."
      );
    } catch (error) {
      console.error("Copy link failed:", error);
      showShareStatus("Please copy the article link manually.");
    }
  }

  function openShareUrl(url, width, height) {
    const features = width && height
      ? `width=${width},height=${height}`
      : "";
    const popup = window.open(url, "_blank", features);
    if (!popup) window.location.href = url;
  }

  function handleShareClick(event) {
    const button = event.target.closest(
      "#shareWhatsApp, #shareFacebook, #shareCopy, #shareNative"
    );
    if (!button) return;

    event.preventDefault();

    const shareUrl = getShareUrl();
    const articleTitle = getArticleShareTitle();

    if (button.id === "shareWhatsApp") {
      const text =
        articleTitle +
        "\n\nRead this article on Teacher Resource Hub:\n" +
        shareUrl;
      openShareUrl("https://wa.me/?text=" + encodeURIComponent(text));
      return;
    }

    if (button.id === "shareFacebook") {
      openShareUrl(
        "https://www.facebook.com/sharer/sharer.php?u=" +
          encodeURIComponent(shareUrl),
        700,
        600
      );
      return;
    }

    if (button.id === "shareCopy") {
      copyArticleLink(shareUrl);
      return;
    }

    if (button.id === "shareNative") {
      if (!navigator.share) {
        showShareStatus(
          "Your browser does not support the device sharing option."
        );
        return;
      }

      navigator.share({
        title: articleTitle,
        text: "Read this article on Teacher Resource Hub.",
        url: shareUrl
      }).catch(function (error) {
        if (error && error.name !== "AbortError") {
          console.error("Native sharing failed:", error);
        }
      });
    }
  }

  // Delegation is intentional because the article is rendered dynamically.
  document.addEventListener("click", handleShareClick);

  function updateNativeShareButton() {
    const nativeButton = document.getElementById("shareNative");
    if (nativeButton && !navigator.share) {
      nativeButton.style.display = "none";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateNativeShareButton);
  } else {
    updateNativeShareButton();
  }
})();
