document.getElementById("year").textContent = new Date().getFullYear();

const commentList = document.getElementById("commentList");
const notice = document.getElementById("adminNotice");
const tabs = [...document.querySelectorAll(".admin-tab")];

let currentStatus = "pending";
let articlesBySlug = {};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GH", {
    day:"numeric", month:"long", year:"numeric",
    hour:"numeric", minute:"2-digit"
  }).format(new Date(value));
}

function showNotice(message, type = "success") {
  notice.className = `admin-notice ${type} show`;
  notice.textContent = message;
  setTimeout(() => notice.classList.remove("show"), 3500);
}

async function ensureAdmin() {
  const { data: { user } } = await educationSupabase.auth.getUser();

  if (!user) {
    commentList.innerHTML = `
      <div class="edu-error">
        You must be signed in to access comment moderation.
        <br><br><a href="index.html">Go to Teacher Resource Hub</a>
      </div>`;
    return false;
  }

  const { data, error } = await educationSupabase.rpc("is_current_user_admin");

  if (error || data !== true) {
    console.error(error);
    commentList.innerHTML = `
      <div class="edu-error">
        <strong>Access denied.</strong><br>
        This page is available only to the Teacher Resource Hub administrator.
      </div>`;
    return false;
  }

  return true;
}

async function loadArticles() {
  const { data, error } = await educationSupabase
    .from("articles")
    .select("slug,title")
    .eq("status", "published");

  if (error) {
    console.error(error);
    return;
  }

  articlesBySlug = {};
  (data || []).forEach(article => {
    articlesBySlug[article.slug] = article.title;
  });
}

async function loadCounts() {
  for (const status of ["pending", "approved", "rejected"]) {
    const { count, error } = await educationSupabase
      .from("article_comments")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

    if (!error) {
      document.getElementById(`${status}Count`).textContent = count || 0;
    }
  }
}

function actionButton(label, action, className = "") {
  return `<button class="admin-action ${className}" data-action="${action}">${label}</button>`;
}

async function loadComments() {
  commentList.innerHTML = '<div class="edu-empty">Loading comments…</div>';

  const { data, error } = await educationSupabase
    .from("article_comments")
    .select("id,article_slug,user_id,author_name,body,status,created_at,updated_at")
    .eq("status", currentStatus)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    commentList.innerHTML = '<div class="edu-error">Comments could not be loaded.</div>';
    return;
  }

  if (!data || !data.length) {
    const message = currentStatus === "pending"
      ? "No comments are waiting for approval."
      : `No ${currentStatus} comments yet.`;
    commentList.innerHTML = `<div class="edu-empty">${message}</div>`;
    return;
  }

  commentList.innerHTML = data.map(comment => {
    const title = articlesBySlug[comment.article_slug] || comment.article_slug;

    let actions = "";
    if (currentStatus === "pending") {
      actions =
        actionButton("✓ Approve", "approve", "approve") +
        actionButton("Reject", "reject", "reject") +
        actionButton("Delete", "delete", "delete");
    } else if (currentStatus === "approved") {
      actions =
        actionButton("Remove", "reject", "reject") +
        actionButton("Delete", "delete", "delete");
    } else {
      actions =
        actionButton("Approve", "approve", "approve") +
        actionButton("Delete", "delete", "delete");
    }

    return `
      <article class="admin-comment-card" data-id="${escapeHTML(comment.id)}">
        <div class="admin-comment-top">
          <div>
            <div class="admin-comment-author">${escapeHTML(comment.author_name)}</div>
            <div class="admin-comment-meta">${escapeHTML(formatDate(comment.created_at))}</div>
          </div>
          <span class="admin-status ${escapeHTML(comment.status)}">${escapeHTML(comment.status)}</span>
        </div>

        <div class="admin-article-label">
          Article: <strong>${escapeHTML(title)}</strong>
        </div>

        <div class="admin-comment-body">${escapeHTML(comment.body)}</div>

        <div class="admin-actions">${actions}</div>
      </article>`;
  }).join("");

  commentList.querySelectorAll(".admin-action").forEach(button => {
    button.addEventListener("click", () => handleAction(button));
  });
}

async function handleAction(button) {
  const card = button.closest(".admin-comment-card");
  const id = card.dataset.id;
  const action = button.dataset.action;

  button.disabled = true;
  button.textContent = "Working…";

  if (action === "delete") {
    const confirmed = window.confirm("Delete this comment permanently?");
    if (!confirmed) {
      button.disabled = false;
      button.textContent = "Delete";
      return;
    }

    const { error } = await educationSupabase
      .from("article_comments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      showNotice("The comment could not be deleted.", "error");
    } else {
      showNotice("Comment deleted.");
    }
  } else {
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error } = await educationSupabase
      .from("article_comments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      showNotice("The comment could not be updated.", "error");
    } else {
      showNotice(newStatus === "approved" ? "Comment approved and published." : "Comment rejected.");
    }
  }

  await refresh();
}

async function refresh() {
  await loadCounts();
  await loadComments();
}

tabs.forEach(tab => {
  tab.addEventListener("click", async () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentStatus = tab.dataset.status;
    await loadComments();
  });
});

(async function init() {
  const ok = await ensureAdmin();
  if (!ok) return;
  await loadArticles();
  await refresh();
})();
