const root = document.getElementById("articleRoot");
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

function renderArticleContent(text) {
  const lines = String(text || "").replace(/\\r\\n/g,"\n").replace(/\\n/g,"\n").split("\n");
  let html = "";
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    const content = paragraph.join(" ").trim();
    if (content) html += `<p>${escapeHTML(content)}</p>`;
    paragraph = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      html += `<h2>${escapeHTML(trimmed.slice(3))}</h2>`;
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  return html;
}

function getSlug() {
  return new URLSearchParams(window.location.search).get("slug");
}

function currentUser() {
  return educationSupabase.auth.getUser();
}

async function loadArticle() {
  const slug = getSlug();

  if (!slug) {
    root.innerHTML = '<div class="edu-error">This article could not be found.</div>';
    return;
  }

  const { data: article, error } = await educationSupabase
    .from("articles")
    .select("slug,title,category,content,author_name,reading_time,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !article) {
    console.error(error);
    root.innerHTML = '<div class="edu-error">This article could not be found or is not currently published.</div>';
    return;
  }

  document.title = `${article.title} | Education in Ghana | Teacher Resource Hub`;

  root.innerHTML = `
    <div class="edu-category">${escapeHTML(article.category)}</div>
    <h1>${escapeHTML(article.title)}</h1>
    <div class="edu-byline">
      By <strong>${escapeHTML(article.author_name || "Teacher Resource Hub")}</strong>
      ${article.published_at ? " · " + escapeHTML(formatDate(article.published_at)) : ""}
      ${article.reading_time ? " · " + article.reading_time + " minute read" : ""}
    </div>

    <div class="edu-body">${renderArticleContent(article.content)}</div>

    <section class="edu-discussion" id="discussion">
      <h2>Reader Discussion</h2>
      <p class="edu-discussion-intro">
        What do you think? Have something to add, a different experience, or another perspective?
        Share your thoughts below.
      </p>
      <div id="commentArea"></div>
      <div id="commentsList" class="edu-comments">
        <div class="edu-empty">Loading comments…</div>
      </div>
    </section>
  `;

  await setupComments(article.slug);
}

async function setupComments(articleSlug) {
  const commentArea = document.getElementById("commentArea");
  const commentsList = document.getElementById("commentsList");

  async function renderCommentArea() {
    const { data: { user } } = await currentUser();

    if (!user) {
      commentArea.innerHTML = `
        <div class="edu-comment-form">
          <p class="edu-signin-note">
            Please sign in to your Teacher Resource Hub account to join the discussion.
            <a href="index.html">Sign in / Create account</a>
          </p>
        </div>
      `;
      return;
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.email ||
      "Reader";

    commentArea.innerHTML = `
      <form class="edu-comment-form" id="commentForm">
        <textarea id="commentBody" maxlength="2000" required
          placeholder="Write your comment…"></textarea>
        <div class="edu-form-row">
          <span class="edu-meta">Posting as ${escapeHTML(displayName)}</span>
          <button class="edu-primary" id="commentSubmit" type="submit">Post Comment</button>
        </div>
      </form>
    `;

    document.getElementById("commentForm").addEventListener("submit", async event => {
      event.preventDefault();

      const body = document.getElementById("commentBody").value.trim();
      const button = document.getElementById("commentSubmit");

      if (!body) return;

      button.disabled = true;
      button.textContent = "Posting…";

      const { data: latest } = await currentUser();
      if (!latest?.user) {
        button.disabled = false;
        button.textContent = "Post Comment";
        alert("Your session has expired. Please sign in again.");
        return;
      }

      const name =
        latest.user.user_metadata?.full_name ||
        latest.user.email ||
        "Reader";

      const { error } = await educationSupabase
        .from("article_comments")
        .insert({
          article_slug: articleSlug,
          user_id: latest.user.id,
          author_name: name,
          body: body,
          status: "pending"
        });

      if (error) {
        console.error(error);
        alert("We could not post your comment. Please try again.");
      } else {
        document.getElementById("commentBody").value = "";
        alert("Your comment has been submitted and is awaiting approval.");
      }

      button.disabled = false;
      button.textContent = "Post Comment";
      await loadComments(articleSlug);
    });
  }

  async function loadComments() {
    const { data, error } = await educationSupabase
      .from("article_comments")
      .select("id,article_slug,user_id,author_name,body,parent_id,created_at")
      .eq("article_slug", articleSlug)
      .eq("status", "approved")
      .order("created_at",{ascending:true});

    if (error) {
      console.error(error);
      commentsList.innerHTML = '<div class="edu-error">Comments could not be loaded right now.</div>';
      return;
    }

    if (!data || !data.length) {
      commentsList.innerHTML = '<div class="edu-empty">No comments yet. Be the first to share your thoughts.</div>';
      return;
    }

    const top = data.filter(c => !c.parent_id);
    const replies = data.filter(c => c.parent_id);

    commentsList.innerHTML = top.map(comment => {
      const children = replies.filter(r => r.parent_id === comment.id);

      return `
        <div class="edu-comment">
          <div class="edu-comment-head">
            <span class="edu-comment-name">${escapeHTML(comment.author_name)}</span>
            <span class="edu-comment-time">${escapeHTML(formatDate(comment.created_at))}</span>
          </div>
          <div class="edu-comment-body">${escapeHTML(comment.body)}</div>
          ${children.map(reply => `
            <div class="edu-reply">
              <div class="edu-comment-head">
                <span class="edu-comment-name">${escapeHTML(reply.author_name)}</span>
                <span class="edu-comment-time">${escapeHTML(formatDate(reply.created_at))}</span>
              </div>
              <div class="edu-comment-body">${escapeHTML(reply.body)}</div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
  }

  await renderCommentArea();
  await loadComments();
}

loadArticle();
