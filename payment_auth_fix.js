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
let library = null;
let breadcrumb = null;
let libraryDescription = null;
let searchInput = null;

function cacheDOM() {
  library = document.getElementById("library");
  breadcrumb = document.getElementById("breadcrumb");
  libraryDescription = document.getElementById("libraryDescription");
  searchInput = document.getElementById("searchInput");
}


/* =========================================================
   PAYSTACK / TERM PAYMENT
========================================================= */

const PAYSTACK_FUNCTION_NAME = "paystack-payment";
const ACADEMIC_YEAR = "2026/2027";
const TERM_UNLOCK_PRICE = 20;

let paymentInProgress = false;

async function invokePaymentFunction(body) {
  if (typeof supabaseClient === "undefined") {
    throw new Error("Supabase client is not available.");
  }

  /* For the payment Edge Function, explicitly attach the current Supabase
     access token. This fixes cases where the browser has a valid signed-in
     session but functions.invoke does not automatically forward it after
     a mobile/browser session refresh. Nothing else in the download flow
     is changed here. */
  const paymentSession = await getReliableAuthSession();

  if (!paymentSession?.access_token) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await supabaseClient.functions.invoke(
    PAYSTACK_FUNCTION_NAME,
    {
      body,
      headers: {
        Authorization: `Bearer ${paymentSession.access_token}`
      }
    }
  );

  if (error) {
    console.error("Payment function error:", error);

    let detail = "";

    try {
      if (error.context && typeof error.context.json === "function") {
        const errorBody = await error.context.json();
        detail = errorBody?.error || errorBody?.message || "";
      }
    } catch (_) {
      /* Keep the general error message below. */
    }

    throw new Error(
      detail || error.message || "The payment service could not be reached."
    );
  }

  return data;
}


/* =========================================================
   PAYMENT SESSION + FANCY UNLOCK MODAL
========================================================= */

async function savePaymentSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    const session = data?.session;
    if (!session?.access_token || !session?.refresh_token) return false;

    sessionStorage.setItem(
      "teacherResourceHubPaymentSession",
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
    );
    return true;
  } catch (error) {
    console.warn("Could not save payment session:", error);
    return false;
  }
}

async function restorePaymentSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) return data.session;

    const saved = sessionStorage.getItem("teacherResourceHubPaymentSession");
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (!parsed?.access_token || !parsed?.refresh_token) return null;

    const { data: restored, error } = await supabaseClient.auth.setSession({
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token
    });

    if (error) {
      console.warn("Could not restore payment session:", error);
      return null;
    }

    return restored?.session || null;
  } catch (error) {
    console.warn("Payment session restoration failed:", error);
    return null;
  }
}

function ensurePaymentModalStyles() {
  if (document.getElementById("trhPaymentModalStyles")) return;

  const style = document.createElement("style");
  style.id = "trhPaymentModalStyles";
  style.textContent = `
    .trh-payment-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(24, 12, 45, .68);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      animation: trhFadeIn .18s ease;
    }
    .trh-payment-modal {
      width: min(430px, 100%);
      overflow: hidden;
      border-radius: 24px;
      background: #fff;
      box-shadow: 0 24px 70px rgba(20, 8, 45, .35);
      transform: translateY(0);
      animation: trhModalIn .22s ease;
      font-family: inherit;
    }
    .trh-payment-top {
      position: relative;
      padding: 26px 24px 22px;
      color: #fff;
      background: linear-gradient(135deg, #6d28d9, #8b5cf6 58%, #a855f7);
    }
    .trh-payment-icon {
      width: 52px;
      height: 52px;
      display: grid;
      place-items: center;
      margin-bottom: 13px;
      border-radius: 16px;
      background: rgba(255,255,255,.17);
      font-size: 25px;
      border: 1px solid rgba(255,255,255,.2);
    }
    .trh-payment-top h3 {
      margin: 0 0 5px;
      font-size: 22px;
      line-height: 1.2;
      color: #fff;
    }
    .trh-payment-top p {
      margin: 0;
      color: rgba(255,255,255,.88);
      font-size: 14px;
    }
    .trh-payment-body {
      padding: 22px 24px 24px;
      color: #28202f;
    }
    .trh-payment-body p {
      margin: 0 0 15px;
      line-height: 1.55;
      font-size: 15px;
    }
    .trh-price {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 2px 0 18px;
      padding: 9px 14px;
      border-radius: 999px;
      color: #5b21b6;
      background: #f3e8ff;
      font-weight: 800;
      font-size: 15px;
    }
    .trh-payment-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .trh-payment-actions button {
      border: 0;
      border-radius: 12px;
      padding: 12px 17px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .trh-payment-cancel {
      background: #f4f1f7;
      color: #5d5365;
    }
    .trh-payment-continue {
      color: #fff;
      background: linear-gradient(135deg, #6d28d9, #8b5cf6);
      box-shadow: 0 8px 20px rgba(109,40,217,.25);
    }
    @keyframes trhFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes trhModalIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `;
  document.head.appendChild(style);
}

function showTermUnlockModal(term) {
  return new Promise(resolve => {
    ensurePaymentModalStyles();

    const overlay = document.createElement("div");
    overlay.className = "trh-payment-overlay";
    overlay.innerHTML = `
      <div class="trh-payment-modal" role="dialog" aria-modal="true" aria-labelledby="trhPaymentTitle">
        <div class="trh-payment-top">
          <div class="trh-payment-icon">🔐</div>
          <h3 id="trhPaymentTitle">Unlock ${escapeHTML(term || "This Term")}</h3>
          <p>Keep teaching. Keep accessing your resources.</p>
        </div>
        <div class="trh-payment-body">
          <p>You have used your <strong>2 free downloads</strong> for this term.</p>
          <div class="trh-price">✨ GH₵${TERM_UNLOCK_PRICE} · Full Term Access</div>
          <p>Unlock this term to continue downloading the lesson plans, lesson notes and other resources available for it.</p>
          <div class="trh-payment-actions">
            <button type="button" class="trh-payment-cancel">Not now</button>
            <button type="button" class="trh-payment-continue">Continue to Paystack →</button>
          </div>
        </div>
      </div>
    `;

    const finish = value => {
      overlay.remove();
      resolve(value);
    };

    overlay.querySelector(".trh-payment-cancel").addEventListener("click", () => finish(false));
    overlay.querySelector(".trh-payment-continue").addEventListener("click", () => finish(true));
    overlay.addEventListener("click", event => {
      if (event.target === overlay) finish(false);
    });

    document.body.appendChild(overlay);
  });
}

async function startTermPayment(term) {
  if (paymentInProgress) return;

  if (!term) {
    alert("Please select a term before unlocking it.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    alert("The payment system is not connected yet. Please refresh the page and try again.");
    return;
  }

  try {
    /* Use the same reliable session check used by the download flow. */
    const paymentSession = await getReliableAuthSession();

    if (!paymentSession) {
      alert("Please sign in or create a teacher account before unlocking a term.");
      if (typeof openAccountModal === "function") openAccountModal();
      return;
    }

    paymentInProgress = true;

    const academicPeriodName = `${ACADEMIC_YEAR} — ${term}`;

    const { data: period, error: periodError } =
      await supabaseClient
        .from("academic_periods")
        .select("id,name,start_date,end_date")
        .eq("name", academicPeriodName)
        .maybeSingle();

    if (periodError) {
      console.error("Academic period lookup error:", periodError);
      alert("We could not prepare this term for payment. Please try again.");
      return;
    }

    if (!period) {
      alert("This academic term has not been configured for payment yet.");
      return;
    }

    const endDate = new Date(`${period.end_date}T23:59:59Z`);

    if (new Date() > endDate) {
      alert("This academic term has ended and can no longer be unlocked.");
      return;
    }

    const result = await invokePaymentFunction({
      action: "initialize",
      academic_period_id: period.id
    });

    if (result?.already_unlocked) {
      alert("This term is already unlocked.");
      return;
    }

    if (!result?.authorization_url) {
      console.error("Unexpected payment initialization response:", result);
      alert("We could not start the payment. Please try again.");
      return;
    }

    if (result.reference) {
      sessionStorage.setItem(
        "teacherResourceHubPendingPayment",
        result.reference
      );
    }

    /* Keep a same-tab backup of the signed-in Supabase session. Some mobile
       browsers can return from Paystack without immediately restoring the
       local Supabase session. */
    await savePaymentSession();

    window.location.href = result.authorization_url;
  } catch (error) {
    console.error("Term payment initialization failed:", error);
    alert(
      error?.message ||
      `We could not start the GH₵${TERM_UNLOCK_PRICE} payment. Please try again.`
    );
  } finally {
    paymentInProgress = false;
  }
}

async function verifyReturnedPayment() {
  const url = new URL(window.location.href);

  const reference =
    url.searchParams.get("reference") ||
    url.searchParams.get("trxref") ||
    sessionStorage.getItem("teacherResourceHubPendingPayment");

  if (!reference) return;

  const hasPaymentQuery =
    url.searchParams.has("reference") ||
    url.searchParams.has("trxref");

  const pendingReference =
    sessionStorage.getItem("teacherResourceHubPendingPayment");

  if (!hasPaymentQuery && !pendingReference) return;

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is unavailable for payment verification.");
    return;
  }

  try {
    const restoredSession = await restorePaymentSession();

    if (!restoredSession) {
      console.warn(
        "Payment return detected, but the teacher session could not be restored."
      );
      alert("We returned from Paystack, but your teacher session could not be restored. Please sign in again and try the download.");
      return;
    }

    const result = await invokePaymentFunction({
      action: "verify",
      reference
    });

    if (result?.paid && result?.success) {
      sessionStorage.removeItem("teacherResourceHubPendingPayment");
      sessionStorage.removeItem("teacherResourceHubPaymentSession");

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      alert(
        `Payment successful. ${result.term || "This term"} is now unlocked. You can continue downloading resources.`
      );

      return;
    }

    if (result?.paid === false) {
      sessionStorage.removeItem("teacherResourceHubPendingPayment");
      sessionStorage.removeItem("teacherResourceHubPaymentSession");

      alert(
        result.message ||
        "The payment has not been completed."
      );
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    alert(
      "We returned from Paystack, but we could not confirm the payment yet. Please refresh the page and try again."
    );
  }
}

/* =========================================================
   SUPABASE RESOURCE DATA
========================================================= */

let protectedResources = [];
let protectedResourcesLoaded = false;

/* Never let a missing/failed resources.js file blank the whole page. */
function getLocalResources() {
  try {
    return (typeof resources !== "undefined" && Array.isArray(resources))
      ? resources
      : [];
  } catch (error) {
    console.error("Local resource data could not be read:", error);
    return [];
  }
}

/* Download buttons use IDs stored here instead of putting file names inside
   inline JavaScript. This is safer and much less likely to break on phones. */
const downloadTargets = new Map();
let downloadTargetCounter = 0;

async function loadProtectedResources() {
  if (protectedResourcesLoaded) return true;

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is not available.");
    return false;
  }

  try {
    const { data, error } = await supabaseClient
      .from("resources")
      .select(
        "id,class,subject,term,resource_type,week,topic,title,file_path,is_active"
      )
      .eq("is_active", true);

    if (error) {
      console.error("Could not load protected resources:", error);
      return false;
    }

    protectedResources = data || [];
    protectedResourcesLoaded = true;
    return true;
  } catch (error) {
    console.error("Protected resource loading failed:", error);
    return false;
  }
}

function findProtectedResource(resource) {
  if (!resource || !protectedResources.length) return null;

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
   RELIABLE AUTH SESSION CHECK
   This only strengthens the sign-in check. It does not change
   the download rules, resource loading, payment logic, or page design.
========================================================= */

async function getReliableAuthSession() {
  if (typeof supabaseClient === "undefined") return null;

  try {
    // First use the normal persisted session.
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) {
      console.warn("Session check error:", sessionError);
    }

    if (sessionData?.session) {
      return sessionData.session;
    }

    // If the browser has the refresh token but the access token is
    // temporarily unavailable/expired, let Supabase restore it.
    const { data: refreshedData, error: refreshError } =
      await supabaseClient.auth.refreshSession();

    if (refreshError) {
      console.warn("Session refresh error:", refreshError);
      return null;
    }

    return refreshedData?.session || null;
  } catch (error) {
    console.warn("Reliable session check failed:", error);
    return null;
  }
}

/* =========================================================
   SECURE DOWNLOAD
========================================================= */

async function handleResourceDownload(targetKey) {
  const target = downloadTargets.get(String(targetKey));

  if (!target) {
    alert("This resource could not be identified. Please refresh the page and try again.");
    return;
  }

  const resource = target.resource;
  const filename = target.filename;

  if (!filename) {
    alert("This resource does not have a download file yet.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    alert("The resource system is not connected yet. Please refresh the page and try again.");
    return;
  }

  try {
    const session = await getReliableAuthSession();

    if (!session) {
      alert("Please sign in or create a teacher account before downloading resources.");
      if (typeof openAccountModal === "function") openAccountModal();
      return;
    }

    /* Load the database resource list only when a teacher actually requests
       a download. The visible library therefore never depends on Supabase
       loading successfully. */
    const loaded = await loadProtectedResources();

    if (!loaded) {
      alert("We could not connect to the resource access system. Please refresh the page and try again.");
      return;
    }

    const dbResource = findProtectedResource(resource);

    if (!dbResource) {
      alert("This resource has not yet been connected to the download system. Please try again later.");
      console.error("No matching database resource found for:", resource);
      return;
    }

    const { data, error } = await supabaseClient.rpc(
      "request_resource_download",
      { p_resource_id: dbResource.id }
    );

    if (error) {
      console.error("Download access error:", error);
      alert("We could not check your download access. Please try again.");
      return;
    }

    if (data?.allowed) {
      const link = document.createElement("a");
      link.href = getFileUrl(filename);
      link.download = "";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (data?.reason === "not_authenticated") {
      // The account may still be signed in while the access token needs a refresh.
      const refreshedSession = await getReliableAuthSession();

      if (refreshedSession) {
        const { data: retryData, error: retryError } = await supabaseClient.rpc(
          "request_resource_download",
          { p_resource_id: dbResource.id }
        );

        if (!retryError && retryData?.allowed) {
          const link = document.createElement("a");
          link.href = getFileUrl(filename);
          link.download = "";
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          link.remove();
          return;
        }

        if (!retryError && retryData?.reason === "free_limit_reached") {
          const shouldPay = await showTermUnlockModal(
            currentTerm || resource.term || "this term"
          );

          if (shouldPay) {
            await startTermPayment(resource.term || currentTerm);
          }

          return;
        }
      }

      alert("Please sign in or create a teacher account before downloading resources.");
      if (typeof openAccountModal === "function") openAccountModal();
      return;
    }

    if (data?.reason === "free_limit_reached") {
      const shouldPay = await showTermUnlockModal(
        currentTerm || resource.term || "this term"
      );

      if (shouldPay) {
        await startTermPayment(resource.term || currentTerm);
      }

      return;
    }

    alert("This resource is not currently available for download.");
  } catch (error) {
    console.error("Unexpected download error:", error);
    alert("Something went wrong while preparing the download. Please try again.");
  }
}

/* Backward-compatible function name in case another part of the page calls it. */
async function requestResourceDownload(resourceId, filename) {
  if (!resourceId || !filename) return;

  if (typeof supabaseClient === "undefined") {
    alert("The resource system is not connected yet.");
    return;
  }

  const session = await getReliableAuthSession();

  if (!session) {
    alert("Please sign in or create a teacher account before downloading resources.");
    if (typeof openAccountModal === "function") openAccountModal();
    return;
  }

  const { data, error } = await supabaseClient.rpc(
    "request_resource_download",
    { p_resource_id: resourceId }
  );

  if (error) {
    console.error("Download access error:", error);
    alert("We could not check your download access. Please try again.");
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

  if (data?.reason === "free_limit_reached") {
    const { data: dbResource, error: resourceError } =
      await supabaseClient
        .from("resources")
        .select("id,term")
        .eq("id", resourceId)
        .maybeSingle();

    if (resourceError || !dbResource) {
      alert("You have reached your 2 free downloads for this term. Please try again.");
      return;
    }

    const shouldPay = await showTermUnlockModal(dbResource.term);

    if (shouldPay) {
      await startTermPayment(dbResource.term);
    }

    return;
  }

  alert("This resource is not currently available for download.");
}

/* =========================================================
   DOWNLOAD BUTTON
========================================================= */

function createDownloadButton(resource, label, extraClass = "") {
  const filename = resource?.file || resource?.plan || resource?.notes;

  if (!filename) {
    return `
      <button class="download-button ${extraClass}" type="button" disabled>
        ${escapeHTML(label)}
      </button>
    `;
  }

  const key = String(++downloadTargetCounter);
  downloadTargets.set(key, { resource, filename });

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
    const count = getLocalResources().filter(
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
    const count = getLocalResources().filter(
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
    const termResources = getLocalResources().filter(
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

  const termResources = getLocalResources().filter(
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
              resource.file
                ? createDownloadButton(
                    resource,
                    "↓ Download Lesson Plans & Notes"
                  )
                : ""
            }

            ${
              !resource.file && resource.plan
                ? createDownloadButton(
                    resource,
                    "Lesson Plan",
                    "secondary"
                  )
                : ""
            }

            ${
              !resource.file && resource.notes
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

  const results = getLocalResources().filter(resource => {
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
              resource.file
                ? createDownloadButton(
                    resource,
                    "Download"
                  )
                : ""
            }

            ${
              !resource.file && resource.plan
                ? createDownloadButton(
                    resource,
                    "Plan",
                    "secondary"
                  )
                : ""
            }

            ${
              !resource.file && resource.notes
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

/* =========================================================
   MOBILE MENU
========================================================= */

let menuToggle = null;
let mobileNav = null;

function closeMobileMenu() {
  if (mobileNav) mobileNav.classList.remove("active");
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
  cacheDOM();
  menuToggle = document.getElementById("menuToggle");
  mobileNav = document.getElementById("mobileNav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function() {
      mobileNav.classList.toggle("active");
    });
  }

  /* The library is rendered from resources.js first. It does NOT wait for
     Supabase, so a slow network can never make the resource section vanish. */
  if (library && breadcrumb && libraryDescription) {
    renderClasses();
  } else {
    console.error("Teacher Resource Hub: required library elements were not found.");
    return;
  }

  /* Check whether the teacher has just returned from Paystack. */
  await verifyReturnedPayment();

  /* Supabase is loaded in the background. The buttons themselves can also
     trigger this load when clicked, so they remain visible and usable. */
  loadProtectedResources().catch(function(error) {
    console.error("Background resource loading failed:", error);
  });

  if (searchInput) {
    searchInput.addEventListener("keydown", function(event) {
      if (event.key === "Enter") performSearch();
    });
  }
});
