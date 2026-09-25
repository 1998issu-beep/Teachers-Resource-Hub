/* =========================================================
   TEACHER RESOURCE HUB
   Navigation Engine
   Class → Subject → Term → Week → Downloads
   ========================================================= */

const classGrid = document.getElementById("classGrid");
const libraryView = document.getElementById("libraryView");
const breadcrumb = document.getElementById("breadcrumb");

const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");

const yearElement = document.getElementById("year");


/* =========================================================
   CONFIGURATION
   ========================================================= */

const JHS_SUBJECTS = [
  "Mathematics",
  "Computing",
  "English",
  "Science",
  "Social Studies"
];

const PRIMARY_SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies"
];

const TERMS = [
  "First Term",
  "Second Term",
  "Third Term"
];

const CLASSES = [
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


/* =========================================================
   NAVIGATION STATE
   ========================================================= */

let currentClass = null;
let currentSubject = null;
let currentTerm = null;


/* =========================================================
   HELPERS
   ========================================================= */

function getSubjectsForClass(className) {

  const classNumber = Number(
    className.replace("Basic ", "")
  );

  return classNumber >= 7
    ? JHS_SUBJECTS
    : PRIMARY_SUBJECTS;
}


function getClassNumber(className) {

  return Number(
    className.replace("Basic ", "")
  );

}


function resourceExistsForClass(className) {

  return resources.some(
    item => item.class === className
  );

}


function getSubjectResources(className, subject) {

  return resources.filter(
    item =>
      item.class === className &&
      item.subject === subject
  );

}


function getTermResources(className, subject, term) {

  return resources.filter(
    item =>
      item.class === className &&
      item.subject === subject &&
      item.term === term
  );

}


function getAvailableSubjects(className) {

  const allowedSubjects =
    getSubjectsForClass(className);

  return allowedSubjects.filter(subject =>
    resources.some(
      item =>
        item.class === className &&
        item.subject === subject
    )
  );

}


function getAvailableTerms(className, subject) {

  return TERMS.filter(term =>
    resources.some(
      item =>
        item.class === className &&
        item.subject === subject &&
        item.term === term
    )
  );

}


function scrollToLibrary() {

  document.querySelector(".library-section")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================================
   BREADCRUMBS
   ========================================================= */

function renderBreadcrumb() {

  if (!currentClass) {

    breadcrumb.innerHTML = "";

    return;

  }


  let html = `
    <button data-level="classes">
      Classes
    </button>
  `;


  if (currentClass) {

    html += `
      <span class="separator">/</span>

      <button data-level="subjects">
        ${currentClass}
      </button>
    `;

  }


  if (currentSubject) {

    html += `
      <span class="separator">/</span>

      <button data-level="terms">
        ${currentSubject}
      </button>
    `;

  }


  if (currentTerm) {

    html += `
      <span class="separator">/</span>

      <span>${currentTerm}</span>
    `;

  }


  breadcrumb.innerHTML = html;


  breadcrumb
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener("click", () => {

        const level =
          button.dataset.level;

        if (level === "classes") {

          currentClass = null;
          currentSubject = null;
          currentTerm = null;

          renderClasses();

          document
            .querySelector("#classes")
            .scrollIntoView({
              behavior: "smooth"
            });

        }


        if (level === "subjects") {

          currentSubject = null;
          currentTerm = null;

          renderSubjects();

          scrollToLibrary();

        }


        if (level === "terms") {

          currentTerm = null;

          renderTerms();

          scrollToLibrary();

        }

      });

    });

}


/* =========================================================
   CLASS VIEW
   ========================================================= */

function renderClasses() {

  classGrid.innerHTML = "";

  CLASSES.forEach((className, index) => {

    const available =
      resourceExistsForClass(className);

    const card =
      document.createElement("article");

    card.className =
      "class-card animate-in";

    card.style.animationDelay =
      `${index * 0.04}s`;

    card.innerHTML = `

      <span class="class-number">
        ${getClassNumber(className)}
      </span>

      <span class="class-arrow">→</span>

      <h3>${className}</h3>

      <p>
        ${available
          ? "Explore available teaching resources"
          : "Resources coming soon"
        }
      </p>

    `;


    card.addEventListener("click", () => {

      currentClass = className;
      currentSubject = null;
      currentTerm = null;

      renderSubjects();

      scrollToLibrary();

    });


    classGrid.appendChild(card);

  });


  libraryView.innerHTML = "";

  renderBreadcrumb();

}


/* =========================================================
   SUBJECT VIEW
   ========================================================= */

function renderSubjects() {

  classGrid.innerHTML = "";

  const subjects =
    getAvailableSubjects(currentClass);


  const heading = document.createElement("div");

  heading.className =
    "library-header animate-in";

  heading.innerHTML = `

    <div>

      <span class="section-kicker">
        ${currentClass}
      </span>

      <h2>Choose a subject</h2>

    </div>

    <p>
      Select a subject to explore its
      first, second and third term resources.
    </p>

  `;


  libraryView.innerHTML = "";

  libraryView.appendChild(heading);


  if (!subjects.length) {

    libraryView.appendChild(
      createEmptyState(
        "No resources yet",
        `There are currently no uploaded resources for ${currentClass}.`
      )
    );

    renderBreadcrumb();

    return;

  }


  const grid =
    document.createElement("div");

  grid.className =
    "navigation-grid";


  subjects.forEach((subject, index) => {

    const card =
      document.createElement("article");

    card.className =
      "navigation-card animate-in";

    card.style.animationDelay =
      `${index * 0.05}s`;


    const icon =
      getSubjectIcon(subject);


    const count =
      getSubjectResources(
        currentClass,
        subject
      ).length;


    card.innerHTML = `

      <div class="navigation-icon">
        ${icon}
      </div>

      <span class="navigation-arrow">→</span>

      <h3>${subject}</h3>

      <p>
        ${count} resource${count === 1 ? "" : "s"} available
      </p>

    `;


    card.addEventListener("click", () => {

      currentSubject = subject;
      currentTerm = null;

      renderTerms();

      scrollToLibrary();

    });


    grid.appendChild(card);

  });


  libraryView.appendChild(grid);

  renderBreadcrumb();

}


/* =========================================================
   TERM VIEW
   ========================================================= */

function renderTerms() {

  libraryView.innerHTML = "";


  const heading =
    document.createElement("div");

  heading.className =
    "library-header animate-in";

  heading.innerHTML = `

    <div>

      <span class="section-kicker">
        ${currentClass} · ${currentSubject}
      </span>

      <h2>Choose a term</h2>

    </div>

    <p>
      Select a term to see the lesson plans
      and lesson notes organised by week.
    </p>

  `;


  libraryView.appendChild(heading);


  const terms =
    getAvailableTerms(
      currentClass,
      currentSubject
    );


  if (!terms.length) {

    libraryView.appendChild(
      createEmptyState(
        "No terms available",
        "Resources for this subject have not been uploaded yet."
      )
    );

    renderBreadcrumb();

    return;

  }


  const grid =
    document.createElement("div");

  grid.className =
    "navigation-grid";


  terms.forEach((term, index) => {

    const card =
      document.createElement("article");

    card.className =
      "navigation-card animate-in";

    card.style.animationDelay =
      `${index * 0.06}s`;


    const count =
      getTermResources(
        currentClass,
        currentSubject,
        term
      ).length;


    card.innerHTML = `

      <div class="navigation-icon">
        ${getTermIcon(term)}
      </div>

      <span class="navigation-arrow">→</span>

      <h3>${term}</h3>

      <p>
        ${count} weekly resource${count === 1 ? "" : "s"}
      </p>

    `;


    card.addEventListener("click", () => {

      currentTerm = term;

      renderWeeks();

      scrollToLibrary();

    });


    grid.appendChild(card);

  });


  libraryView.appendChild(grid);

  renderBreadcrumb();

}


/* =========================================================
   WEEK VIEW
   ========================================================= */

function renderWeeks() {

  libraryView.innerHTML = "";


  const heading =
    document.createElement("div");

  heading.className =
    "library-header animate-in";

  heading.innerHTML = `

    <div>

      <span class="section-kicker">
        ${currentClass} · ${currentSubject}
      </span>

      <h2>${currentTerm}</h2>

    </div>

    <p>
      Choose a week to download the available
      lesson plan and lesson notes.
    </p>

  `;


  libraryView.appendChild(heading);


  const termResources =
    getTermResources(
      currentClass,
      currentSubject,
      currentTerm
    );


  const sorted =
    [...termResources].sort(
      (a, b) =>
        extractWeekNumber(a.week) -
        extractWeekNumber(b.week)
    );


  if (!sorted.length) {

    libraryView.appendChild(
      createEmptyState(
        "No weekly resources",
        "There are currently no lesson materials uploaded for this term."
      )
    );

    renderBreadcrumb();

    return;

  }


  const list =
    document.createElement("div");

  list.className =
    "week-list";


  sorted.forEach((resource, index) => {

    const card =
      document.createElement("article");

    card.className =
      "week-card animate-in";

    card.style.animationDelay =
      `${index * 0.04}s`;


    const topic =
      resource.topic ||
      "Lesson resources";


    card.innerHTML = `

      <div class="week-info">

        <span class="week-number">
          ${extractWeekNumber(resource.week)}
        </span>

        <div>

          <h3>
            ${resource.week}
          </h3>

          <p>
            ${topic}
          </p>

        </div>

      </div>

      <div class="resource-actions">

        ${
          resource.plan
            ? `
              <a
                class="download-button"
                href="${encodeURI(resource.plan)}"
                download
              >
                ↓ Lesson Plan
              </a>
            `
            : ""
        }

        ${
          resource.notes
            ? `
              <a
                class="download-button notes"
                href="${encodeURI(resource.notes)}"
                download
              >
                ↓ Lesson Notes
              </a>
            `
            : ""
        }

      </div>

    `;


    list.appendChild(card);

  });


  libraryView.appendChild(list);

  renderBreadcrumb();

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function createEmptyState(title, message) {

  const state =
    document.createElement("div");

  state.className =
    "empty-state animate-in";


  state.innerHTML = `

    <div class="empty-icon">
      ✦
    </div>

    <h3>${title}</h3>

    <p>${message}</p>

  `;


  return state;

}


/* =========================================================
   SEARCH
   ========================================================= */

function performSearch(query) {

  const value =
    query.trim().toLowerCase();


  clearSearch.classList.toggle(
    "visible",
    value.length > 0
  );


  if (!value) {

    renderClasses();

    return;

  }


  classGrid.innerHTML = "";

  libraryView.innerHTML = "";

  breadcrumb.innerHTML = "";


  const results =
    resources.filter(resource => {

      const searchable = [

        resource.class,
        resource.subject,
        resource.term,
        resource.week,
        resource.topic

      ]
        .join(" ")
        .toLowerCase();


      return searchable.includes(value);

    });


  const heading =
    document.createElement("div");

  heading.className =
    "library-header animate-in";

  heading.innerHTML = `

    <div>

      <span class="section-kicker">
        SEARCH RESULTS
      </span>

      <h2>
        ${results.length} result${results.length === 1 ? "" : "s"}
      </h2>

    </div>

    <p>
      Showing resources matching
      “${escapeHTML(query)}”.
    </p>

  `;


  libraryView.appendChild(heading);


  if (!results.length) {

    libraryView.appendChild(
      createEmptyState(
        "Nothing found",
        "Try searching for another class, subject, term, week or topic."
      )
    );

    return;

  }


  const list =
    document.createElement("div");

  list.className =
    "week-list";


  results.forEach((resource, index) => {

    const card =
      document.createElement("article");

    card.className =
      "week-card search-result-card animate-in";

    card.style.animationDelay =
      `${index * 0.03}s`;


    card.innerHTML = `

      <div class="week-info">

        <span class="week-number">
          ${extractWeekNumber(resource.week)}
        </span>

        <div>

          <h3>
            ${resource.class}
            · ${resource.subject}
          </h3>

          <p>
            ${resource.term}
            · ${resource.week}
            · ${resource.topic || "Lesson resource"}
          </p>

        </div>

      </div>

      <div class="resource-actions">

        ${
          resource.plan
            ? `
              <a
                class="download-button"
                href="${encodeURI(resource.plan)}"
                download
              >
                ↓ Plan
              </a>
            `
            : ""
        }

        ${
          resource.notes
            ? `
              <a
                class="download-button notes"
                href="${encodeURI(resource.notes)}"
                download
              >
                ↓ Notes
              </a>
            `
            : ""
        }

      </div>

    `;


    list.appendChild(card);

  });


  libraryView.appendChild(list);

}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function extractWeekNumber(week) {

  if (!week) return 0;

  const match =
    String(week).match(/\d+/);

  return match
    ? Number(match[0])
    : 0;

}


function getSubjectIcon(subject) {

  const icons = {

    "Mathematics": "∑",

    "Computing": "⌘",

    "English": "Aa",

    "Science": "⚗",

    "Social Studies": "◎"

  };


  return icons[subject] || "✦";

}


function getTermIcon(term) {

  if (term === "First Term") return "01";

  if (term === "Second Term") return "02";

  if (term === "Third Term") return "03";

  return "✦";

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

menuButton.addEventListener("click", () => {

  mainNav.classList.toggle("open");

});


mainNav.querySelectorAll("a")
  .forEach(link => {

    link.addEventListener("click", () => {

      mainNav.classList.remove("open");

    });

  });


/* =========================================================
   SEARCH EVENTS
   ========================================================= */

searchInput.addEventListener(
  "input",
  () => {

    performSearch(
      searchInput.value
    );

  }
);


clearSearch.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    clearSearch.classList.remove(
      "visible"
    );

    renderClasses();

    searchInput.focus();

  }
);


/* =========================================================
   INITIALISE
   ========================================================= */

yearElement.textContent =
  new Date().getFullYear();


renderClasses();
