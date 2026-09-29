/* =========================================================
   TEACHER RESOURCE HUB
   Main website functionality
   Supabase-protected download stage
========================================================= */

/* BASIC CONFIGURATION */
const classes = [
  "Basic 1","Basic 2","Basic 3","Basic 4","Basic 5","Basic 6",
  "Basic 7","Basic 8","Basic 9"
];

const primarySubjects = [
  "Mathematics","English","Science","Social Studies"
];

const jhsSubjects = [
  "Mathematics","Computing","English","Science","Social Studies"
];

/* APP STATE */
let currentClass = null;
let currentSubject = null;
let currentTerm = null;

/* DOM */
const library = document.getElementById("library");
const breadcrumb = document.getElementById("breadcrumb");
const libraryDescription = document.getElementById("libraryDescription");
const searchInput = document.getElementById("searchInput");

/* =========================================================
   SUPABASE RESOURCE DATA
========================================================= */

let protectedResources = [];
let protectedResourcesLoaded = false;

async function loadProtectedResources() {
  if (protectedResourcesLoaded) return;

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is not available.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("resources")
    .select(
      "id,class,subject,term,resource_type,week,topic,title,file_path,is_active"
    )
    .eq("is_active", true);

  if (error) {
    console.error("Could not load protected resources:", error);
    return;
  }

  protectedResources = data || [];
  protectedResourcesLoaded = true;
}

function findProtectedResource(resource) {
  if (!resource) return null;

  const possibleFiles = [
    resource.file,
    resource.plan,
    resource.notes
  ].filter(Boolean);

  return protectedResources.find(dbResource =>
    dbResource.class === resource.class &&
    dbResource.subject === resource.subject &&
    dbResource.term === resource.term &&
    possibleFiles.includes(dbResource.file_path)
  ) || null;
}

/* =========================================================
   SECURE DOWNLOAD
========================================================= */

async function requestResourceDownload(resourceId, filename) {
  if (!resourceId || !filename) return;

  if (typeof supabaseClient === "undefined") {
    alert("The resource system is not connected yet.");
    return;
  }

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError);
    alert("We could not check your account. Please try again.");
    return;
  }

  const session = sessionData?.session;

  if (!session) {
    alert(
      "Please sign in or create a teacher account before downloading resources."
    );

    if (typeof openAccountModal === "function") {
      openAccountModal();
    }

    return;
  }

  const { data, error } = await supabaseClient.rpc(
    "request_resource_download",
    {
      p_resource_id: resourceId
    }
  );

  if (error) {
    console.error("Download access error:", error);
    alert(
      "We could not check your download access. Please try again."
    );
    return;
  }

  if (data?.allowed) {
    const link = document.createElement("a");
    link.href = getFileUrl(filename);
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  if (data?.reason === "not_authenticated") {
    alert(
      "Please sign in or create a teacher account before downloading resources."
    );

    if (typeof openAccountModal === "function") {
      openAccountModal();
    }

    return;
  }

  if (data?.reason === "free_limit_reached") {
    alert(
      "You have used your 2 free downloads for this term. " +
      "Unlock this term for GH₵20 to continue downloading resources."
    );

    return;
  }

  alert(
    "This resource is not currently available for download."
  );
}

/* =========================================================
   DOWNLOAD BUTTON
========================================================= */

function createDownloadButton(resource, label, extraClass = "") {
  const dbResource = findProtectedResource(resource);

  if (!dbResource) {
    return `
      <button
        class="download-button ${extraClass}"
        type="button"
        disabled
        title="Resource is not yet registered"
      >
        ${escapeHTML(label)}
      </button>
    `;
  }

  const safeId = String(dbResource.id).replace(/'/g, "\\'");
  const safeFile = String(dbResource.file_path).replace(/'/g, "\\'");

  return `
    <button
      class="download-button ${extraClass}"
      type="button"
      onclick="requestResourceDownload('${safeId}', '${safeFile}')"
    >
      ${escapeHTML(label)}
    </button>
  `;
}

/* =========================================================
   HELPERS
========================================================= */

function getSubjectsForClass(className) {
  const classNumber = parseInt(className.replace("Basic ", ""), 10);
  return classNumber <= 6 ? primarySubjects : jhsSubjects;
}

function isScheme(resource) {
  return resource.type === "scheme";
}

function isLesson(resource) {
  return resource.type === "lesson" || !resource.type;
}

function getFileUrl(filename) {
  if (!filename) return "#";
  return encodeURI(filename);
}

function escapeHTML(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getClassNumber(className) {
  return parseInt(className.replace("Basic ", ""), 10);
}

/* =========================================================
   HOME
========================================================= */

function goHome() {
  currentClass = null;
  currentSubject = null;
  currentTerm = null;
  renderClasses();

  const resourcesSection = document.getElementById("resources");
  if (resourcesSection) {
    resourcesSection.scrollIntoView({ behavior: "smooth" });
  }
}

/* =========================================================
   BREADCRUMB
========================================================= */

function renderBreadcrumb() {
  let html = `<button onclick="goHome()">Classes</button>`;

  if (currentClass) {
    html += `
      <span class="crumb-separator">›</span>
      <button onclick="selectClass('${escapeHTML(currentClass)}')">
        ${escapeHTML(currentClass)}
      </button>
    `;
  }

  if (currentSubject) {
    html += `
      <span class="crumb-separator">›</span>
      <button onclick="selectSubject('${escapeHTML(currentSubject)}')">
        ${escapeHTML(currentSubject)}
      </button>
    `;
  }

  if (currentTerm) {
    html += `
      <span class="crumb-separator">›</span>
      <span class="current">${escapeHTML(currentTerm)}</span>
    `;
  }

  breadcrumb.innerHTML = html;
}

/* =========================================================
   CLASS VIEW
========================================================= */

function renderClasses() {
  renderBreadcrumb();

  libraryDescription.textContent =
    "Choose a class to begin exploring available teaching resources.";

  let html = `<div class="class-grid">`;

  classes.forEach((className, index) => {
    const count = resources.filter(
      resource => resource.class === className
    ).length;

    html += `
      <article
        class="class-card"
        onclick="selectClass('${className}')"
      >
        <div class="class-number">
          BASIC ${String(index + 1).padStart(2, "0")}
        </div>

        <h3>${className}</h3>

        <p>
          ${
            count > 0
              ? `${count} resource${count === 1 ? "" : "s"} available`
              : "Resources coming soon"
          }
        </p>

        <div class="class-arrow">→</div>
      </article>
    `;
  });

  html += `</div>`;
  library.innerHTML = html;
}

/* =========================================================
   SELECT CLASS
========================================================= */

function selectClass(className) {
  currentClass = className;
  currentSubject = null;
  currentTerm = null;

  renderSubjects();

  document.getElementById("resources").scrollIntoView({
    behavior: "smooth"
  });
}

/* =========================================================
   SUBJECT VIEW
========================================================= */

function renderSubjects() {
  renderBreadcrumb();

  libraryDescription.textContent =
    `Choose a subject for ${currentClass}.`;

  const subjects = getSubjectsForClass(currentClass);

  let html = `<div class="subject-grid">`;

  subjects.forEach(subject => {
    const count = resources.filter(
      resource =>
        resource.class === currentClass &&
        resource.subject === subject
    ).length;

    html += `
      <article
        class="subject-card"
        onclick="selectSubject('${subject}')"
      >
        <div>
          <h3>${subject}</h3>

          <p>
            ${
              count > 0
                ? `${count} resource${count === 1 ? "" : "s"}`
                : "No resources yet"
            }
          </p>
        </div>

        <div class="subject-icon">→</div>
      </article>
    `;
  });

  html += `</div>`;
  library.innerHTML = html;
}

/* =========================================================
   SELECT SUBJECT
========================================================= */

function selectSubject(subject) {
  currentSubject = subject;
  currentTerm = null;

  renderTerms();

  document.getElementById("resources").scrollIntoView({
    behavior: "smooth"
  });
}

/* =========================================================
   TERM VIEW
========================================================= */

function renderTerms() {
  renderBreadcrumb();

  libraryDescription.textContent =
    `${currentSubject} resources for ${currentClass}.`;

  const termNames = [
    "First Term",
    "Second Term",
    "Third Term"
  ];

  let html = `<div class="term-grid">`;

  termNames.forEach(term => {
    const termResources = resources.filter(
      resource =>
        resource.class === currentClass &&
        resource.subject === currentSubject &&
        resource.term === term
    );

    const schemeExists = termResources.some(isScheme);
    const lessonCount = termResources.filter(isLesson).length;

    html += `
      <article
        class="term-card"
        onclick="selectTerm('${term}')"
      >
        <h3>${term}</h3>

        <p>Explore schemes and weekly lesson resources.</p>

        <div class="term-meta">
          ${
            schemeExists
              ? `<span class="meta-badge scheme-badge">Scheme available</span>`
              : ""
          }

          ${
            lessonCount > 0
              ? `<span class="meta-badge">
                   ${lessonCount} lesson resource${lessonCount === 1 ? "" : "s"}
                 </span>`
              : ""
          }

          ${
            !schemeExists && lessonCount === 0
              ? `<span class="meta-badge">Coming soon</span>`
              : ""
          }
        </div>
      </article>
    `;
  });

  html += `</div>`;
  library.innerHTML = html;
}

/* =========================================================
   SELECT TERM
========================================================= */

function selectTerm(term) {
  currentTerm = term;

  renderTermResources();

  document.getElementById("resources").scrollIntoView({
    behavior: "smooth"
  });
}

/* =========================================================
   TERM RESOURCE PAGE
========================================================= */

function renderTermResources() {
  renderBreadcrumb();

  libraryDescription.textContent =
    `${currentClass} · ${currentSubject} · ${currentTerm}`;

  const termResources = resources.filter(
    resource =>
      resource.class === currentClass &&
      resource.subject === currentSubject &&
      resource.term === currentTerm
  );

  const schemes = termResources.filter(isScheme);
  const lessons = termResources.filter(isLesson);

  let html = "";

  if (schemes.length > 0) {
    schemes.forEach(scheme => {
      if (!scheme.file) return;

      html += `
        <div class="scheme-panel">
          <div class="scheme-icon">📘</div>

          <div class="scheme-content">
            <h3>Scheme of Learning</h3>

            <p>${escapeHTML(
              scheme.title ||
              `${currentClass} ${currentSubject} ${currentTerm} Scheme of Learning`
            )}</p>
          </div>

          ${createDownloadButton(
            scheme,
            "↓ Download Scheme"
          )}
        </div>
      `;
    });
  }

  html += `
    <div class="resource-heading">
      <h3>Weekly Lesson Resources</h3>
      <p>Lesson plans and lesson notes organised by week.</p>
    </div>
  `;

  if (lessons.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>

        <h3>No weekly resources yet</h3>

        <p>
          Lesson plans and lesson notes for this term
          will appear here when they are uploaded.
        </p>
      </div>
    `;
  } else {
    lessons.sort(compareWeeks);

    html += `<div class="week-list">`;

    lessons.forEach(resource => {
      const week = resource.week || "Resource";
      const weekNumber = extractWeekNumber(week);

      html += `
        <article class="week-card">

          <div class="week-number">
            ${weekNumber ? `WEEK ${weekNumber}` : "FILE"}
          </div>

          <div class="week-info">
            <h4>${escapeHTML(
              resource.topic || "Teaching Resource"
            )}</h4>

            <p>${escapeHTML(week)}</p>
          </div>

          <div class="resource-buttons">

            ${
              resource.plan
                ? createDownloadButton(
                    resource,
                    "Lesson Plan",
                    "secondary"
                  )
                : ""
            }

            ${
              resource.notes
                ? createDownloadButton(
                    resource,
                    "Lesson Notes"
                  )
                : ""
            }

          </div>

        </article>
      `;
    });

    html += `</div>`;
  }

  library.innerHTML = html;
}

/* =========================================================
   WEEK SORTING
========================================================= */

function extractWeekNumber(week) {
  if (!week) return null;

  const match = String(week).match(/\d+/);

  return match ? parseInt(match[0], 10) : null;
}

function compareWeeks(a, b) {
  const aNumber = extractWeekNumber(a.week);
  const bNumber = extractWeekNumber(b.week);

  if (aNumber === null && bNumber === null) {
    return String(a.week || "")
      .localeCompare(String(b.week || ""));
  }

  if (aNumber === null) return 1;
  if (bNumber === null) return -1;

  return aNumber - bNumber;
}

/* =========================================================
   SEARCH
========================================================= */

function performSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    goHome();
    return;
  }

  const results = resources.filter(resource => {
    const searchableText = [
      resource.class,
      resource.subject,
      resource.term,
      resource.week,
      resource.topic,
      resource.title,
      resource.file,
      resource.plan,
      resource.notes
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  renderSearchResults(results);

  document.getElementById("resources").scrollIntoView({
    behavior: "smooth"
  });
}

/* =========================================================
   SEARCH RESULTS
========================================================= */

function renderSearchResults(results) {
  currentClass = null;
  currentSubject = null;
  currentTerm = null;

  breadcrumb.innerHTML = `
    <button onclick="goHome()">Classes</button>
    <span class="crumb-separator">›</span>
    <span class="current">Search results</span>
  `;

  libraryDescription.textContent =
    `Showing ${results.length} matching resource${results.length === 1 ? "" : "s"}.`;

  if (results.length === 0) {
    library.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔎</div>

        <h3>No resources found</h3>

        <p>
          Try searching for a class, subject, term, week,
          topic or resource name.
        </p>
      </div>
    `;

    return;
  }

  let html = `<div class="search-results">`;

  results.forEach(resource => {

    if (isScheme(resource)) {

      html += `
        <article class="search-result">

          <div class="result-icon">📘</div>

          <div class="result-content">

            <h3>${escapeHTML(
              resource.title ||
              `${resource.class} ${resource.subject} Scheme of Learning`
            )}</h3>

            <p>
              ${escapeHTML(resource.class)}
              ·
              ${escapeHTML(resource.subject)}
              ·
              ${escapeHTML(resource.term)}
            </p>

          </div>

          ${createDownloadButton(
            resource,
            "Download Scheme"
          )}

        </article>
      `;

    } else {

      html += `
        <article class="search-result">

          <div class="result-icon">📚</div>

          <div class="result-content">

            <h3>${escapeHTML(
              resource.topic || "Teaching Resource"
            )}</h3>

            <p>
              ${escapeHTML(resource.class)}
              ·
              ${escapeHTML(resource.subject)}
              ·
              ${escapeHTML(resource.term)}
              ·
              ${escapeHTML(resource.week || "")}
            </p>

          </div>

          <div class="resource-buttons">

            ${
              resource.plan
                ? createDownloadButton(
                    resource,
                    "Plan",
                    "secondary"
                  )
                : ""
            }

            ${
              resource.notes
                ? createDownloadButton(
                    resource,
                    "Notes"
                  )
                : ""
            }

          </div>

        </article>
      `;
    }
  });

  html += `</div>`;

  library.innerHTML = html;
}

/* =========================================================
   SEARCH ENTER KEY
========================================================= */

if (searchInput) {
  searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      performSearch();
    }
  });
}

/* =========================================================
   MOBILE MENU
========================================================= */

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");

if (menuToggle) {
  menuToggle.addEventListener("click", function() {
    mobileNav.classList.toggle("active");
  });
}

function closeMobileMenu() {
  if (mobileNav) {
    mobileNav.classList.remove("active");
  }
}

/* =========================================================
   SCROLL TO LIBRARY
========================================================= */

function scrollToLibrary() {
  document.getElementById("resources").scrollIntoView({
    behavior: "smooth"
  });
}

/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async function() {
  await loadProtectedResources();
  renderClasses();
});
