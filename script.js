const resourceGrid = document.getElementById("resourceGrid");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");
const resourceCount = document.getElementById("resourceCount");
const classButtons = document.querySelectorAll(".class-filter");

let selectedClass = "All";


function displayResources() {

  const searchTerm = searchInput.value.toLowerCase().trim();

  const filteredResources = resources.filter(resource => {

    const matchesClass =
      selectedClass === "All" ||
      resource.class === selectedClass;

    const searchableText = `
      ${resource.class}
      ${resource.subject}
      ${resource.term}
      ${resource.week}
      ${resource.topic}
    `.toLowerCase();

    const matchesSearch =
      searchableText.includes(searchTerm);

    return matchesClass && matchesSearch;
  });


  resourceGrid.innerHTML = "";


  filteredResources.forEach(resource => {

    const card = document.createElement("article");

    card.className = "resource-card";

    card.innerHTML = `

      <div class="resource-top">

        <span class="class-badge">
          ${resource.class}
        </span>

        <span class="subject">
          ${resource.subject}
        </span>

      </div>


      <h3>
        ${resource.topic}
      </h3>


      <div class="resource-meta">
        ${resource.term} &nbsp;•&nbsp; ${resource.week}
      </div>


      <div class="download-buttons">

        <a
          class="download-button primary"
          href="${resource.plan}"
          target="_blank"
          rel="noopener"
        >
          Lesson Plan
        </a>

        <a
          class="download-button"
          href="${resource.notes}"
          target="_blank"
          rel="noopener"
        >
          Lesson Notes
        </a>

      </div>

    `;

    resourceGrid.appendChild(card);
  });


  resourceCount.textContent =
    `${filteredResources.length} resource${filteredResources.length === 1 ? "" : "s"}`;


  if (filteredResources.length === 0) {
    noResults.classList.add("show");
  } else {
    noResults.classList.remove("show");
  }
}


/* CLASS FILTERS */

classButtons.forEach(button => {

  button.addEventListener("click", () => {

    classButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    selectedClass = button.dataset.class;

    displayResources();

  });

});


/* SEARCH */

searchInput.addEventListener("input", displayResources);


/* MOBILE MENU */

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");

menuButton.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});


/* CURRENT YEAR */

document.getElementById("year").textContent =
  new Date().getFullYear();


/* INITIAL DISPLAY */

displayResources();
