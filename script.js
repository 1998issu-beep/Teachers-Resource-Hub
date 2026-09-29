/* =========================================================
   TEACHER RESOURCE HUB
   Main Website Functionality
   Supabase Download Access
========================================================= */


/* =========================================================
   BASIC CONFIGURATION
========================================================= */

const classes = [
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "Basic 7",
  "Basic 8",
  "Basic 9"
];

const primarySubjects = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies"
];

const jhsSubjects = [
  "Mathematics",
  "Computing",
  "English",
  "Science",
  "Social Studies"
];


/* =========================================================
   APP STATE
========================================================= */

let currentClass = null;
let currentSubject = null;
let currentTerm = null;


/* =========================================================
   DOM REFERENCES
========================================================= */

let library = null;
let breadcrumb = null;
let libraryDescription = null;
let searchInput = null;
let menuToggle = null;
let mobileNav = null;


/* =========================================================
   SUPABASE RESOURCE DATA
========================================================= */

let protectedResources = [];
let protectedResourcesLoaded = false;


/* =========================================================
   DOWNLOAD TARGETS
========================================================= */

const downloadTargets = new Map();
let downloadTargetCounter = 0;


/* =========================================================
   INITIALISE DOM REFERENCES
========================================================= */

function cacheDOM() {

  library = document.getElementById("library");

  breadcrumb = document.getElementById("breadcrumb");

  libraryDescription =
    document.getElementById("libraryDescription");

  searchInput =
    document.getElementById("searchInput");

  menuToggle =
    document.getElementById("menuToggle");

  mobileNav =
    document.getElementById("mobileNav");
}


/* =========================================================
   LOCAL RESOURCE DATA
========================================================= */

function getLocalResources() {

  try {

    if (
      typeof resources !== "undefined" &&
      Array.isArray(resources)
    ) {
      return resources;
    }

  } catch (error) {

    console.error(
      "Could not read resources.js:",
      error
    );

  }

  return [];
}


/* =========================================================
   SUPABASE RESOURCE LOADING
========================================================= */

async function loadProtectedResources() {

  if (protectedResourcesLoaded) {
    return true;
  }

  if (
    typeof supabaseClient === "undefined" ||
    !supabaseClient
  ) {

    console.error(
      "Supabase client is not available."
    );

    return false;
  }

  try {

    const result =
      await supabaseClient
        .from("resources")
        .select(
          "id,class,subject,term,resource_type,week,topic,title,file_path,is_active"
        )
        .eq("is_active", true);

    if (result.error) {

      console.error(
        "Could not load protected resources:",
        result.error
      );

      return false;
    }

    protectedResources =
      result.data || [];

    protectedResourcesLoaded = true;

    return true;

  } catch (error) {

    console.error(
      "Protected resource loading failed:",
      error
    );

    return false;
  }
}


/* =========================================================
   FILE NAME HELPER
========================================================= */

function getFileNameOnly(path) {

  if (!path) {
    return "";
  }

  const value = String(path);

  const parts =
    value.split("/");

  return parts[parts.length - 1];
}


/* =========================================================
   FIND DATABASE RESOURCE
========================================================= */

function findProtectedResource(resource) {

  if (
    !resource ||
    !protectedResources.length
  ) {
    return null;
  }

  const possibleFiles = [
    resource.file,
    resource.plan,
    resource.notes
  ].filter(Boolean);

  return protectedResources.find(function(dbResource) {

    if (
      dbResource.class !== resource.class ||
      dbResource.subject !== resource.subject ||
      dbResource.term !== resource.term
    ) {
      return false;
    }

    const databaseFile =
      getFileNameOnly(dbResource.file_path);

    return possibleFiles.some(function(file) {

      const localFile =
        getFileNameOnly(file);

      return (
        file === dbResource.file_path ||
        localFile === databaseFile
      );

    });

  }) || null;
}


/* =========================================================
   SECURE DOWNLOAD
========================================================= */

async function handleResourceDownload(targetKey) {

  const target =
    downloadTargets.get(
      String(targetKey)
    );

  if (!target) {

    alert(
      "This resource could not be identified. Please refresh the page and try again."
    );

    return;
  }

  const resource =
    target.resource;

  const filename =
    target.filename;


  if (!filename) {

    alert(
      "This resource does not have a download file yet."
    );

    return;
  }


  if (
    typeof supabaseClient === "undefined" ||
    !supabaseClient
  ) {

    alert(
      "The resource access system is not connected. Please refresh the page and try again."
    );

    return;
  }


  try {

    const sessionResult =
      await supabaseClient.auth.getSession();

    if (sessionResult.error) {

      console.error(
        "Session error:",
        sessionResult.error
      );

      alert(
        "We could not check your account. Please try again."
      );

      return;
    }


    const session =
      sessionResult.data &&
      sessionResult.data.session;


    if (!session) {

      alert(
        "Please sign in or create a teacher account before downloading resources."
      );

      if (
        typeof openAccountModal === "function"
      ) {
        openAccountModal();
      }

      return;
    }


    const loaded =
      await loadProtectedResources();


    if (!loaded) {

      alert(
        "We could not connect to the resource access system. Please refresh the page and try again."
      );

      return;
    }


    const dbResource =
      findProtectedResource(resource);


    if (!dbResource) {

      console.error(
        "No matching database resource found:",
        resource
      );

      alert(
        "This resource has not yet been connected to the download system."
      );

      return;
    }


    const rpcResult =
      await supabaseClient.rpc(
        "request_resource_download",
        {
          p_resource_id:
            dbResource.id
        }
      );


    if (rpcResult.error) {

      console.error(
        "Download access error:",
        rpcResult.error
      );

      alert(
        "We could not check your download access. Please try again."
      );

      return;
    }


    const access =
      rpcResult.data;


    if (
      access &&
      access.allowed === true
    ) {

      const link =
        document.createElement("a");

      link.href =
        getFileUrl(filename);

      link.download =
        getFileNameOnly(filename);

      link.rel =
        "noopener";

      document.body.appendChild(link);

      link.click();

      link.remove();

      return;
    }


    if (
      access &&
      access.reason ===
        "not_authenticated"
    ) {

      alert(
        "Please sign in or create a teacher account before downloading resources."
      );

      if (
        typeof openAccountModal === "function"
      ) {
        openAccountModal();
      }

      return;
    }


    if (
      access &&
      access.reason ===
        "free_limit_reached"
    ) {

      alert(
        "You have used your 2 free downloads for this term. Unlock this term for GH₵20 to continue downloading resources."
      );

      return;
    }


    alert(
      "This resource is not currently available for download."
    );


  } catch (error) {

    console.error(
      "Unexpected download error:",
      error
    );

    alert(
      "Something went wrong while preparing the download. Please try again."
    );

  }

}


/* =========================================================
   BACKWARD-COMPATIBLE DOWNLOAD FUNCTION
========================================================= */

async function requestResourceDownload(
  resourceId,
  filename
) {

  if (!resourceId || !filename) {
    return;
  }


  if (
    typeof supabaseClient === "undefined" ||
    !supabaseClient
  ) {

    alert(
      "The resource access system is not connected."
    );

    return;
  }


  try {

    const sessionResult =
      await supabaseClient.auth.getSession();


    if (sessionResult.error) {

      console.error(
        "Session error:",
        sessionResult.error
      );

      alert(
        "We could not check your account. Please try again."
      );

      return;
    }


    if (
      !sessionResult.data ||
      !sessionResult.data.session
    ) {

      alert(
        "Please sign in or create a teacher account before downloading resources."
      );

      if (
        typeof openAccountModal === "function"
      ) {
        openAccountModal();
      }

      return;
    }


    const rpcResult =
      await supabaseClient.rpc(
        "request_resource_download",
        {
          p_resource_id:
            resourceId
        }
      );


    if (rpcResult.error) {

      console.error(
        "Download access error:",
        rpcResult.error
      );

      alert(
        "We could not check your download access. Please try again."
      );

      return;
    }


    if (
      rpcResult.data &&
      rpcResult.data.allowed === true
    ) {

      const link =
        document.createElement("a");

      link.href =
        getFileUrl(filename);

      link.download =
        getFileNameOnly(filename);

      link.rel =
        "noopener";

      document.body.appendChild(link);

      link.click();

      link.remove();

      return;
    }


    if (
      rpcResult.data &&
      rpcResult.data.reason ===
        "free_limit_reached"
    ) {

      alert(
        "You have used your 2 free downloads for this term. Unlock this term for GH₵20 to continue downloading resources."
      );

      return;
    }


    alert(
      "This resource is not currently available for download."
    );


  } catch (error) {

    console.error(
      "Download error:",
      error
    );

    alert(
      "Something went wrong while preparing the download."
    );

  }

}


/* =========================================================
   CREATE DOWNLOAD BUTTON
========================================================= */

function createDownloadButton(
  resource,
  label,
  extraClass
) {

  extraClass =
    extraClass || "";


  const filename =
    resource &&
    (
      resource.file ||
      resource.plan ||
      resource.notes
    );


  if (!filename) {

    return `
      <button
        class="download-button ${extraClass}"
        type="button"
        disabled
      >
        ${escapeHTML(label)}
      </button>
    `;
  }


  const key =
    String(
      ++downloadTargetCounter
    );


  downloadTargets.set(
    key,
    {
      resource: resource,
      filename: filename
    }
  );


  return `
    <button
      class="download-button ${extraClass}"
      type="button"
      data-download-key="${key}"
      onclick="handleResourceDownload('${key}')"
    >
      ${escapeHTML(label)}
    </button>
  `;
}


/* =========================================================
   GENERAL HELPERS
========================================================= */

function getSubjectsForClass(
  className
) {

  const classNumber =
    parseInt(
      className.replace(
        "Basic ",
        ""
      ),
      10
    );

  return classNumber <= 6
    ? primarySubjects
    : jhsSubjects;
}


function isScheme(resource) {

  return (
    resource &&
    resource.type === "scheme"
  );
}


function isLesson(resource) {

  return (
    resource &&
    (
      resource.type === "lesson" ||
      !resource.type
    )
  );
}


function getFileUrl(filename) {

  if (!filename) {
    return "#";
  }

  return encodeURI(filename);
}


function escapeHTML(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function getClassNumber(
  className
) {

  return parseInt(
    className.replace(
      "Basic ",
      ""
    ),
    10
  );
}


/* =========================================================
   HOME
========================================================= */

function goHome() {

  currentClass = null;
  currentSubject = null;
  currentTerm = null;

  renderClasses();

  const resourcesSection =
    document.getElementById(
      "resources"
    );

  if (resourcesSection) {

    resourcesSection.scrollIntoView({
      behavior: "smooth"
    });

  }
}


/* =========================================================
   BREADCRUMB
========================================================= */

function renderBreadcrumb() {

  if (!breadcrumb) {
    return;
  }


  let html = `
    <button onclick="goHome()">
      Classes
    </button>
  `;


  if (currentClass) {

    html += `
      <span class="crumb-separator">
        ›
      </span>

      <button
        onclick="selectClass('${escapeHTML(currentClass)}')"
      >
        ${escapeHTML(currentClass)}
      </button>
    `;
  }


  if (currentSubject) {

    html += `
      <span class="crumb-separator">
        ›
      </span>

      <button
        onclick="selectSubject('${escapeHTML(currentSubject)}')"
      >
        ${escapeHTML(currentSubject)}
      </button>
    `;
  }


  if (currentTerm) {

    html += `
      <span class="crumb-separator">
        ›
      </span>

      <span class="current">
        ${escapeHTML(currentTerm)}
      </span>
    `;
  }


  breadcrumb.innerHTML =
    html;
}


/* =========================================================
   CLASS VIEW
========================================================= */

function renderClasses() {

  if (
    !library ||
    !breadcrumb ||
    !libraryDescription
  ) {

    console.error(
      "Teacher Resource Hub: library elements were not found."
    );

    return;
  }


  renderBreadcrumb();


  libraryDescription.textContent =
    "Choose a class to begin exploring available teaching resources.";


  const localResources =
    getLocalResources();


  let html =
    `<div class="class-grid">`;


  classes.forEach(
    function(className, index) {

      const count =
        localResources.filter(
          function(resource) {

            return (
              resource.class ===
              className
            );

          }
        ).length;


      html += `
        <article
          class="class-card"
          onclick="selectClass('${className}')"
        >

          <div class="class-number">
            BASIC ${
              String(index + 1)
                .padStart(2, "0")
            }
          </div>

          <h3>
            ${className}
          </h3>

          <p>
            ${
              count > 0
                ? `${count} resource${
                    count === 1
                      ? ""
                      : "s"
                  } available`
                : "Resources coming soon"
            }
          </p>

          <div class="class-arrow">
            →
          </div>

        </article>
      `;
    }
  );


  html +=
    `</div>`;


  library.innerHTML =
    html;
}


/* =========================================================
   SELECT CLASS
========================================================= */

function selectClass(
  className
) {

  currentClass =
    className;

  currentSubject =
    null;

  currentTerm =
    null;


  renderSubjects();


  const resourcesSection =
    document.getElementById(
      "resources"
    );

  if (resourcesSection) {

    resourcesSection.scrollIntoView({
      behavior: "smooth"
    });

  }
}


/* =========================================================
   SUBJECT VIEW
========================================================= */

function renderSubjects() {

  renderBreadcrumb();


  libraryDescription.textContent =
    `Choose a subject for ${currentClass}.`;


  const subjects =
    getSubjectsForClass(
      currentClass
    );


  const localResources =
    getLocalResources();


  let html =
    `<div class="subject-grid">`;


  subjects.forEach(
    function(subject) {

      const count =
        localResources.filter(
          function(resource) {

            return (
              resource.class ===
                currentClass &&
              resource.subject ===
                subject
            );

          }
        ).length;


      html += `
        <article
          class="subject-card"
          onclick="selectSubject('${subject}')"
        >

          <div>

            <h3>
              ${escapeHTML(subject)}
            </h3>

            <p>
              ${
                count > 0
                  ? `${count} resource${
                      count === 1
                        ? ""
                        : "s"
                    }`
                  : "No resources yet"
              }
            </p>

          </div>

          <div class="subject-icon">
            →
          </div>

        </article>
      `;
    }
  );


  html +=
    `</div>`;


  library.innerHTML =
    html;
}


/* =========================================================
   SELECT SUBJECT
========================================================= */

function selectSubject(
  subject
) {

  currentSubject =
    subject;

  currentTerm =
    null;


  renderTerms();


  const resourcesSection =
    document.getElementById(
      "resources"
    );

  if (resourcesSection) {

    resourcesSection.scrollIntoView({
      behavior: "smooth"
    });

  }
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


  const localResources =
    getLocalResources();


  let html =
    `<div class="term-grid">`;


  termNames.forEach(
    function(term) {

      const termResources =
        localResources.filter(
          function(resource) {

            return (
              resource.class ===
                currentClass &&
              resource.subject ===
                currentSubject &&
              resource.term ===
                term
            );

          }
        );


      const schemeExists =
        termResources.some(
          isScheme
        );


      const lessonCount =
        termResources.filter(
          isLesson
        ).length;


      html += `
        <article
          class="term-card"
          onclick="selectTerm('${term}')"
        >

          <h3>
            ${term}
          </h3>

          <p>
            Explore schemes and weekly lesson resources.
          </p>

          <div class="term-meta">

            ${
              schemeExists
                ? `
                  <span class="meta-badge scheme-badge">
                    Scheme available
                  </span>
                `
                : ""
            }

            ${
              lessonCount > 0
                ? `
                  <span class="meta-badge">
                    ${lessonCount}
                    lesson resource${
                      lessonCount === 1
                        ? ""
                        : "s"
                    }
                  </span>
                `
                : ""
            }

            ${
              !schemeExists &&
              lessonCount === 0
                ? `
                  <span class="meta-badge">
                    Coming soon
                  </span>
                `
                : ""
            }

          </div>

        </article>
      `;
    }
  );


  html +=
    `</div>`;


  library.innerHTML =
    html;
}


/* =========================================================
   SELECT TERM
========================================================= */

function selectTerm(
  term
) {

  currentTerm =
    term;


  renderTermResources();


  const resourcesSection =
    document.getElementById(
      "resources"
    );

  if (resourcesSection) {

    resourcesSection.scrollIntoView({
      behavior: "smooth"
    });

  }
}


/* =========================================================
   TERM RESOURCE PAGE
========================================================= */

function renderTermResources() {

  renderBreadcrumb();


  libraryDescription.textContent =
    `${currentClass} · ${currentSubject} · ${currentTerm}`;


  const localResources =
    getLocalResources();


  const termResources =
    localResources.filter(
      function(resource) {

        return (
          resource.class ===
            currentClass &&
          resource.subject ===
            currentSubject &&
          resource.term ===
            currentTerm
        );

      }
    );


  const schemes =
    termResources.filter(
      isScheme
    );


  const lessons =
    termResources.filter(
      isLesson
    );


  let html = "";


  if (schemes.length > 0) {

    schemes.forEach(
      function(scheme) {

        if (!scheme.file) {
          return;
        }


        html += `
          <div class="scheme-panel">

            <div class="scheme-icon">
              📘
            </div>

            <div class="scheme-content">

              <h3>
                Scheme of Learning
              </h3>

              <p>
                ${escapeHTML(
                  scheme.title ||
                  `${currentClass} ${currentSubject} ${currentTerm} Scheme of Learning`
                )}
              </p>

            </div>

            ${createDownloadButton(
              scheme,
              "↓ Download Scheme"
            )}

          </div>
        `;
      }
    );

  }


  html += `
    <div class="resource-heading">

      <h3>
        Weekly Lesson Resources
      </h3>

      <p>
        Lesson plans and lesson notes organised by week.
      </p>

    </div>
  `;


  if (lessons.length === 0) {

    html += `
      <div class="empty-state">

        <div class="empty-state-icon">
          📚
        </div>

        <h3>
          No weekly resources yet
        </h3>

        <p>
          Lesson plans and lesson notes for this term
          will appear here when they are uploaded.
        </p>

      </div>
    `;

  } else {

    lessons.sort(
      compareWeeks
    );


    html +=
      `<div class="week-list">`;


    lessons.forEach(
      function(resource) {

        const week =
          resource.week ||
          "Resource";


        const weekNumber =
          extractWeekNumber(
            week
          );


        html += `
          <article class="week-card">

            <div class="week-number">
              ${
                weekNumber
                  ? `WEEK ${weekNumber}`
                  : "FILE"
              }
            </div>

            <div class="week-info">

              <h4>
                ${escapeHTML(
                  resource.topic ||
                  "Teaching Resource"
                )}
              </h4>

              <p>
                ${escapeHTML(week)}
              </p>

            </div>

            <div class="resource-buttons">

              ${
                resource.file
                  ? createDownloadButton(
                      resource,
                      "↓ Download Lesson Plans & Notes"
                    )
                  : ""
              }

              ${
                !resource.file &&
                resource.plan
                  ? createDownloadButton(
                      resource,
                      "Lesson Plan",
                      "secondary"
                    )
                  : ""
              }

              ${
                !resource.file &&
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
      }
    );


    html +=
      `</div>`;
  }


  library.innerHTML =
    html;
}


/* =========================================================
   WEEK SORTING
========================================================= */

function extractWeekNumber(
  week
) {

  if (!week) {
    return null;
  }


  const match =
    String(week).match(
      /\d+/
    );


  return match
    ? parseInt(
        match[0],
        10
      )
    : null;
}


function compareWeeks(
  a,
  b
) {

  const aNumber =
    extractWeekNumber(
      a.week
    );


  const bNumber =
    extractWeekNumber(
      b.week
    );


  if (
    aNumber === null &&
    bNumber === null
  ) {

    return String(
      a.week || ""
    ).localeCompare(
      String(
        b.week || ""
      )
    );

  }


  if (
    aNumber === null
  ) {
    return 1;
  }


  if (
    bNumber === null
  ) {
    return -1;
  }


  return (
    aNumber -
    bNumber
  );
}


/* =========================================================
   SEARCH
========================================================= */

function performSearch() {

  if (!searchInput) {
    return;
  }


  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  if (!query) {

    goHome();

    return;
  }


  const localResources =
    getLocalResources();


  const results =
    localResources.filter(
      function(resource) {

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


        return searchableText.includes(
          query
        );

      }
    );


  renderSearchResults(
    results
  );


  const resourcesSection =
    document.getElementById(
      "resources"
    );


  if (resourcesSection) {

    resourcesSection.scrollIntoView({
      behavior: "smooth"
    });

  }
}


/* =========================================================
   SEARCH RESULTS
========================================================= */

function renderSearchResults(
  results
) {

  currentClass = null;
  currentSubject = null;
  currentTerm = null;


  breadcrumb.innerHTML = `
    <button onclick="goHome()">
      Classes
    </button>

    <span class="crumb-separator">
      ›
    </span>

    <span class="current">
      Search results
    </span>
  `;


  libraryDescription.textContent =
    `Showing ${results.length} matching resource${
      results.length === 1
        ? ""
        : "s"
    }.`;



  if (results.length === 0) {

    library.innerHTML = `
      <div class="empty-state">

        <div class="empty-state-icon">
          🔎
        </div>

        <h3>
          No resources found
        </h3>

        <p>
          Try searching for a class, subject,
          term, week, topic or resource name.
        </p>

      </div>
    `;

    return;
  }


  let html =
    `<div class="search-results">`;


  results.forEach(
    function(resource) {


      if (isScheme(resource)) {

        html += `
          <article class="search-result">

            <div class="result-icon">
              📘
            </div>

            <div class="result-content">

              <h3>
                ${escapeHTML(
                  resource.title ||
                  `${resource.class} ${resource.subject} Scheme of Learning`
                )}
              </h3>

              <p>
                ${escapeHTML(
                  resource.class
                )}
                ·
                ${escapeHTML(
                  resource.subject
                )}
                ·
                ${escapeHTML(
                  resource.term
                )}
              </p>

            </div>

            ${createDownloadButton(
              resource,
              "Download Scheme"
            )}

          </article>
        `;


        return;
      }


      html += `
        <article class="search-result">

          <div class="result-icon">
            📚
          </div>

          <div class="result-content">

            <h3>
              ${escapeHTML(
                resource.topic ||
                "Teaching Resource"
              )}
            </h3>

            <p>
              ${escapeHTML(
                resource.class
              )}
              ·
              ${escapeHTML(
                resource.subject
              )}
              ·
              ${escapeHTML(
                resource.term
              )}
              ·
              ${escapeHTML(
                resource.week || ""
              )}
            </p>

          </div>

          <div class="resource-buttons">

            ${
              resource.file
                ? createDownloadButton(
                    resource,
                    "Download"
                  )
                : ""
            }

            ${
              !resource.file &&
              resource.plan
                ? createDownloadButton(
                    resource,
                    "Plan",
                    "secondary"
                  )
                : ""
            }

            ${
              !resource.file &&
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
  );


  html +=
    `</div>`;


  library.innerHTML =
    html;
}


/* =========================================================
   MOBILE MENU
========================================================= */

function closeMobileMenu() {

  if (mobileNav) {

    mobileNav.classList.remove(
      "active"
    );

  }
}


/* =========================================================
   SCROLL TO RESOURCE LIBRARY
========================================================= */

function scrollToLibrary() {

  const resourcesSection =
    document.getElementById(
      "resources"
    );


  if (resourcesSection) {

    resourcesSection.scrollIntoView({
      behavior: "smooth"
    });

  }
}


/* =========================================================
   INITIALISE WEBSITE
========================================================= */

function initialiseTeacherResourceHub() {

  cacheDOM();


  if (
    menuToggle &&
    mobileNav
  ) {

    menuToggle.addEventListener(
      "click",
      function() {

        mobileNav.classList.toggle(
          "active"
        );

      }
    );

  }


  if (
    library &&
    breadcrumb &&
    libraryDescription
  ) {

    renderClasses();

  } else {

    console.error(
      "Teacher Resource Hub: required library elements were not found."
    );

    return;
  }


  if (searchInput) {

    searchInput.addEventListener(
      "keydown",
      function(event) {

        if (
          event.key ===
          "Enter"
        ) {

          performSearch();

        }

      }
    );

  }


  loadProtectedResources()
    .catch(
      function(error) {

        console.error(
          "Background Supabase loading failed:",
          error
        );

      }
    );

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialiseTeacherResourceHub
  );

} else {

  initialiseTeacherResourceHub();

}
