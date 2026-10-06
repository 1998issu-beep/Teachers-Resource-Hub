

/* Threaded reader replies */
async function enableThreadedReplies(articleSlug, commentsList) {
  async function getUser() {
    return educationSupabase.auth.getUser();
  }

  function replyForm(parentId) {
    return `
      <button type="button" class="edu-reply-trigger" data-id="${escapeHTML(parentId)}">↩ Reply</button>
      <form class="edu-reply-form" data-parent="${escapeHTML(parentId)}">
        <textarea maxlength="2000" required placeholder="Write a reply…"></textarea>
        <div class="edu-form-row">
          <span class="edu-meta">Your reply will be reviewed before publication.</span>
          <button class="edu-primary" type="submit">Post Reply</button>
        </div>
      </form>`;
  }

  commentsList.querySelectorAll(".edu-reply-trigger").forEach(button => {
    button.addEventListener("click", () => {
      const form = button.parentElement.querySelector(".edu-reply-form");
      if (form) form.classList.toggle("open");
    });
  });

  commentsList.querySelectorAll(".edu-reply-form").forEach(form => {
    form.addEventListener("submit", async event => {
      event.preventDefault();

      const textarea = form.querySelector("textarea");
      const button = form.querySelector("button[type='submit']");
      const body = textarea.value.trim();
      if (!body) return;

      const { data: authData } = await getUser();
      if (!authData?.user) {
        showEducationNotice("Sign in required", "Please sign in to reply to a comment.", "error");
        return;
      }

      button.disabled = true;
      button.textContent = "Posting…";

      const user = authData.user;
      const authorName =
        user.user_metadata?.full_name ||
        user.email ||
        "Reader";

      const { error } = await educationSupabase
        .from("article_comments")
        .insert({
          article_slug: articleSlug,
          user_id: user.id,
          author_name: authorName,
          body,
          parent_id: form.dataset.parent,
          status: "pending"
        });

      button.disabled = false;
      button.textContent = "Post Reply";

      if (error) {
        console.error(error);
        showEducationNotice(
          "Reply not posted",
          "We could not post your reply. Please try again.",
          "error"
        );
        return;
      }

      textarea.value = "";
      form.classList.remove("open");

      showEducationNotice(
        "Reply submitted",
        "Your reply has been received and is awaiting approval.",
        "success"
      );

      if (typeof loadComments === "function") {
        await loadComments();
      }
    });
  });
}
