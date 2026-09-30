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

async function getReliableAuthSession() {
  if (typeof supabaseClient === "undefined") return null;

  try {
    const first = await supabaseClient.auth.getSession();
    if (first?.data?.session?.access_token) {
      return first.data.session;
    }

    const refreshed = await supabaseClient.auth.refreshSession();
    if (refreshed?.data?.session?.access_token) {
      return refreshed.data.session;
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    const retry = await supabaseClient.auth.getSession();
    return retry?.data?.session || null;
  } catch (error) {
    console.warn("Reliable session check failed:", error);
    return null;
  }
}

async function invokePaymentFunction(body) {
  if (typeof supabaseClient === "undefined") {
    throw new Error("Supabase client is not available.");
  }

  const session = await getReliableAuthSession();

  if (!session?.access_token) {
    throw new Error("Your teacher session has expired. Please sign in again.");
  }

  const endpoint =
    `${SUPABASE_URL}/functions/v1/${PAYSTACK_FUNCTION_NAME}`;

  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });
  } catch (networkError) {
    console.error("Payment function network error:", networkError);
    throw new Error(
      "We could not connect to the payment service. Please check your internet connection and try again."
    );
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    console.error("Payment function HTTP error:", response.status, payload);

    if (response.status === 401) {
      throw new Error(
        "Your teacher session could not be verified. Please sign out, sign in again, and try once more."
      );
    }

    throw new Error(
      payload?.error ||
      payload?.message ||
      `The payment service returned an error (${response.status}).`
    );
  }

  return payload || {};
}
/* =========================================================
   BEAUTIFUL SITE-WIDE NOTIFICATION POPUPS
   ========================================================= */

function ensureTRHNotificationStyles() {
  if (document.getElementById("trhNotificationStyles")) return;

  const style = document.createElement("style");
  style.id = "trhNotificationStyles";

  style.textContent = `
    .trh-notification-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(20, 10, 35, 0.58);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      opacity: 0;
      animation: trhNotificationFadeIn 0.22s ease forwards;
    }

    .trh-notification-card {
      width: min(420px, 100%);
      overflow: hidden;
      border-radius: 24px;
      background: #ffffff;
      box-shadow:
        0 25px 70px rgba(35, 15, 65, 0.30),
        0 8px 25px rgba(109, 40, 217, 0.12);
      transform: translateY(18px) scale(0.96);
      animation: trhNotificationPop 0.28s cubic-bezier(.2,.8,.2,1) forwards;
      font-family: inherit;
    }

    .trh-notification-header {
      position: relative;
      padding: 25px 24px 22px;
      color: #ffffff;
      overflow: hidden;
    }

    .trh-notification-header::after {
      content: "";
      position: absolute;
      width: 150px;
      height: 150px;
      right: -55px;
      top: -65px;
      border-radius: 50%;
      background: rgba(255,255,255,0.12);
    }

    .trh-notification-icon {
      position: relative;
      z-index: 2;
      width: 52px;
      height: 52px;
      display: grid;
      place-items: center;
      margin-bottom: 13px;
      border-radius: 17px;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.20);
      font-size: 25px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.10);
    }

    .trh-notification-title {
      position: relative;
      z-index: 2;
      margin: 0;
      color: #ffffff;
      font-size: 21px;
      line-height: 1.25;
      font-weight: 800;
      letter-spacing: -0.2px;
    }

    .trh-notification-body {
      padding: 22px 24px 24px;
      color: #30283a;
    }

    .trh-notification-message {
      margin: 0;
      font-size: 15px;
      line-height: 1.65;
      white-space: pre-line;
    }

    .trh-notification-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 22px;
    }

    .trh-notification-button {
      border: 0;
      border-radius: 12px;
      padding: 11px 20px;
      font: inherit;
      font-size: 14px;
      font-weight: 750;
      cursor: pointer;
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        opacity 0.18s ease;
    }

    .trh-notification-button:hover {
      transform: translateY(-1px);
    }

    .trh-notification-button:active {
      transform: translateY(0);
    }

    .trh-notification-ok {
      color: #ffffff;
      background: linear-gradient(135deg, #6d28d9, #8b5cf6);
      box-shadow: 0 7px 18px rgba(109,40,217,0.24);
    }

    .trh-notification-cancel {
      color: #5d5365;
      background: #f3f0f6;
    }

    /* SUCCESS */
    .trh-notification-success .trh-notification-header {
      background: linear-gradient(135deg, #059669, #10b981);
    }

    /* ERROR */
    .trh-notification-error .trh-notification-header {
      background: linear-gradient(135deg, #dc2626, #ef4444);
    }

    /* WARNING */
    .trh-notification-warning .trh-notification-header {
      background: linear-gradient(135deg, #d97706, #f59e0b);
    }

    /* INFO */
    .trh-notification-info .trh-notification-header {
      background: linear-gradient(135deg, #6d28d9, #8b5cf6);
    }

    @keyframes trhNotificationFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes trhNotificationPop {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes trhNotificationFadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @media (max-width: 480px) {
      .trh-notification-overlay {
        padding: 16px;
      }

      .trh-notification-card {
        border-radius: 21px;
      }

      .trh-notification-header {
        padding: 22px 20px 20px;
      }

      .trh-notification-body {
        padding: 20px;
      }

      .trh-notification-title {
        font-size: 19px;
      }

      .trh-notification-message {
        font-size: 14.5px;
      }

      .trh-notification-actions {
        margin-top: 20px;
      }

      .trh-notification-button {
        width: 100%;
        padding: 12px 18px;
      }
    }
  `;

  document.head.appendChild(style);
}


function showTRHNotification(message, options = {}) {
  ensureTRHNotificationStyles();

  const type = options.type || "info";
  const title = options.title || (
    type === "success"
      ? "Success"
      : type === "error"
      ? "Something went wrong"
      : type === "warning"
      ? "Please note"
      : "Teacher Resource Hub"
  );

  const icon = options.icon || (
    type === "success"
      ? "✓"
      : type === "error"
      ? "!"
      : type === "warning"
      ? "⚠"
      : "🔔"
  );

  const overlay = document.createElement("div");
  overlay.className = "trh-notification-overlay";

  overlay.innerHTML = `
    <div class="trh-notification-card trh-notification-${type}"
         role="dialog"
         aria-modal="true"
         aria-labelledby="trhNotificationTitle">

      <div class="trh-notification-header">

        <div class="trh-notification-icon">
          ${icon}
        </div>

        <h3 class="trh-notification-title" id="trhNotificationTitle">
          ${escapeHTML(title)}
        </h3>

      </div>

      <div class="trh-notification-body">

        <p class="trh-notification-message">
          ${escapeHTML(String(message))}
        </p>

        <div class="trh-notification-actions">

          <button
            type="button"
            class="trh-notification-button trh-notification-ok">
            OK
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const okButton = overlay.querySelector(".trh-notification-ok");

  function closeNotification() {
    overlay.style.animation =
      "trhNotificationFadeOut 0.18s ease forwards";

    setTimeout(() => {
      overlay.remove();
    }, 180);
  }

  okButton.addEventListener("click", closeNotification);

  overlay.addEventListener("click", function(event) {
    if (event.target === overlay) {
      closeNotification();
    }
  });

  setTimeout(() => {
    okButton.focus();
  }, 50);
}


/* =========================================================
   REPLACE NORMAL BROWSER ALERTS WITH BEAUTIFUL POPUPS
   ========================================================= */

window.alert = function(message) {
  showTRHNotification(message, {
    type: "info",
    title: "Teacher Resource Hub",
    icon: "🔔"
  });
};
/* =========================================================
   BEAUTIFUL CONFIRMATION POPUP
   ========================================================= */

function showTRHConfirmation(message, options = {}) {
  ensureTRHNotificationStyles();

  const title = options.title || "Continue to Payment?";
  const icon = options.icon || "💳";
  const confirmText = options.confirmText || "Continue";
  const cancelText = options.cancelText || "Cancel";

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "trh-notification-overlay";

    overlay.innerHTML = `
      <div class="trh-notification-card trh-confirm-card"
           role="dialog"
           aria-modal="true"
           aria-labelledby="trhConfirmTitle">

        <div class="trh-notification-header trh-confirm-header">

          <div class="trh-notification-icon">
            ${icon}
          </div>

          <h3 class="trh-notification-title" id="trhConfirmTitle">
            ${escapeHTML(title)}
          </h3>

        </div>

        <div class="trh-notification-body">

          <p class="trh-notification-message">
            ${escapeHTML(String(message))}
          </p>

          <div class="trh-notification-actions">

            <button
              type="button"
              class="trh-notification-button trh-notification-cancel">
              ${escapeHTML(cancelText)}
            </button>

            <button
              type="button"
              class="trh-notification-button trh-notification-ok trh-confirm-button">
              ${escapeHTML(confirmText)}
            </button>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    const cancelButton =
      overlay.querySelector(".trh-notification-cancel");

    const confirmButton =
      overlay.querySelector(".trh-confirm-button");

    let finished = false;

    function closeConfirmation(result) {
      if (finished) return;

      finished = true;

      overlay.style.animation =
        "trhNotificationFadeOut 0.18s ease forwards";

      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 180);
    }

    cancelButton.addEventListener("click", () => {
      closeConfirmation(false);
    });

    confirmButton.addEventListener("click", () => {
      closeConfirmation(true);
    });

    overlay.addEventListener("click", function(event) {
      if (event.target === overlay) {
        closeConfirmation(false);
      }
    });

    setTimeout(() => {
      confirmButton.focus();
    }, 50);
  });
     }
/* =========================================================
   CONFIRMATION POPUP STYLING
   ========================================================= */

(function ensureTRHConfirmationStyles() {
  if (document.getElementById("trhConfirmationStyles")) return;

  const style = document.createElement("style");
  style.id = "trhConfirmationStyles";

  style.textContent = `
    .trh-confirm-header {
      background: linear-gradient(
        135deg,
        #5b21b6,
        #7c3aed,
        #9333ea
      );
    }

    .trh-confirm-card {
      box-shadow:
        0 30px 80px rgba(48, 20, 90, 0.35),
        0 10px 30px rgba(124, 58, 237, 0.18);
    }

    .trh-confirm-button {
      min-width: 120px;
      background: linear-gradient(
        135deg,
        #6d28d9,
        #8b5cf6
      );
    }

    .trh-notification-cancel {
      min-width: 95px;
    }

    @media (max-width: 480px) {
      .trh-notification-actions {
        flex-direction: column-reverse;
      }

      .trh-notification-button {
        width: 100%;
      }

      .trh-confirm-button,
      .trh-notification-cancel {
        min-width: 0;
      }
    }
  `;

  document.head.appendChild(style);
})();
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
    const session = await getReliableAuthSession();

    if (!session) {
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
    const session = await getReliableAuthSession();

    if (!session) {
      console.warn(
        "Payment return detected, but the teacher session is not available."
      );
      return;
    }

    const result = await invokePaymentFunction({
      action: "verify",
      reference
    });

    if (result?.paid && result?.success) {
      sessionStorage.removeItem("teacherResourceHubPendingPayment");

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
   SECURE DOWNLOAD
========================================================= */

async function invokeSecureResourceDownload(resourceId) {
  if (!resourceId) {
    return {
      data: null,
      error: new Error("Missing resource ID.")
    };
  }

  try {
    return await supabaseClient.functions.invoke(
      "resource-download",
      {
        body: {
          resource_id: resourceId
        }
      }
    );
  } catch (error) {
    console.error("Secure resource download invocation failed:", error);
    return {
      data: null,
      error
    };
  }
}

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

    /*
     * The visible library uses resources.js, while Supabase holds the
     * protected copy of every resource and its database ID.
     * We only load that protected list when a teacher requests a download.
     */
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

    /*
     * IMPORTANT:
     * Do not call request_resource_download() directly from the browser.
     * The resource-download Edge Function now performs the authorization
     * check and creates the short-lived signed URL. This prevents the
     * download counter from being incremented twice.
     */
    const { data, error } = await invokeSecureResourceDownload(dbResource.id);

    if (error) {
      console.error("Secure download error:", error);

      /* Supabase may return the function's JSON error body through the
         FunctionsHttpError context, so keep the user-facing message simple. */
      alert("We could not prepare the download. Please try again.");
      return;
    }

    if (data?.allowed && data?.signed_url) {
      const link = document.createElement("a");
      link.href = data.signed_url;
      link.download = "";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (data?.reason === "not_authenticated") {
      alert("Please sign in or create a teacher account before downloading resources.");
      if (typeof openAccountModal === "function") openAccountModal();
      return;
    }

    if (data?.reason === "free_limit_reached") {
      const shouldPay = await showTRHConfirmation(
        `You have used your 2 free downloads for this term.\n\n` +
        `Unlock ${dbResource.term} for GH₵${TERM_UNLOCK_PRICE_GHS} to continue downloading resources.\n\n` +
        `Would you like to continue to Paystack?`,
        {
          title: "Unlock Your Term Resources",
          icon: "💳",
          confirmText: "Continue to Paystack",
          cancelText: "Cancel"
        }
      );

      if (shouldPay) {
        await startTermPayment(dbResource.term);
      }

      return;
    }

    if (data?.reason === "resource_not_found") {
      alert("This resource could not be found in protected storage. Please try again later.");
      return;
    }

    if (data?.reason === "signed_url_error") {
      alert("We could not prepare the secure download. Please try again.");
      return;
    }

    alert("This resource is not currently available for download.");
  } catch (error) {
    console.error("Unexpected secure download error:", error);
    alert("Something went wrong while preparing the download. Please try again.");
  }
}

/*
 * Backward-compatible function name in case another part of the page
 * calls requestResourceDownload(resourceId, filename).
 * It now uses the same secure Edge Function instead of the old public
 * GitHub file URL.
 */
async function requestResourceDownload(resourceId, filename) {
  if (!resourceId) return;

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

  try {
    const { data, error } = await invokeSecureResourceDownload(resourceId);

    if (error) {
      console.error("Secure download error:", error);
      alert("We could not prepare the download. Please try again.");
      return;
    }

    if (data?.allowed && data?.signed_url) {
      const link = document.createElement("a");
      link.href = data.signed_url;
      link.download = "";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (data?.reason === "not_authenticated") {
      alert("Please sign in or create a teacher account before downloading resources.");
      if (typeof openAccountModal === "function") openAccountModal();
      return;
    }

    if (data?.reason === "free_limit_reached") {
      let term = null;

      const { data: dbResource, error: resourceError } =
        await supabaseClient
          .from("resources")
          .select("id,term")
          .eq("id", resourceId)
          .maybeSingle();

      if (!resourceError && dbResource) {
        term = dbResource.term;
      }

      if (!term) {
        alert("You have reached your 2 free downloads for this term. Please try again.");
        return;
      }

      const shouldPay = await showTRHConfirmation(
        `You have used your 2 free downloads for this term.\n\n` +
        `Unlock ${term} for GH₵${TERM_UNLOCK_PRICE_GHS} to continue downloading resources.\n\n` +
        `Would you like to continue to Paystack?`,
        {
          title: "Unlock Your Term Resources",
          icon: "💳",
          confirmText: "Continue to Paystack",
          cancelText: "Cancel"
        }
      );

      if (shouldPay) {
        await startTermPayment(term);
      }

      return;
    }

    alert("This resource is not currently available for download.");
  } catch (error) {
    console.error("Unexpected secure download error:", error);
    alert("Something went wrong while preparing the download. Please try again.");
  }
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
