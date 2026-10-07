/* =========================================================
   TEACHER RESOURCE HUB — PRIVATE ADMIN LINK
   ========================================================= */
(function () {
  "use strict";

  function addAdminLinkStyles() {
    if (document.getElementById("trhAdminLinkStyles")) return;

    const style = document.createElement("style");
    style.id = "trhAdminLinkStyles";
    style.textContent = `
      .trh-admin-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 9px 13px;
        border-radius: 10px;
        color: #4c1d95;
        text-decoration: none;
        font-weight: 700;
        font-size: .9rem;
        background: #f3edff;
        border: 1px solid rgba(109,40,217,.16);
        transition: .2s ease;
      }
      .trh-admin-link:hover {
        background: #e9ddff;
        transform: translateY(-1px);
      }
      .mobile-nav .trh-admin-link {
        margin: 6px 0;
      }
    `;
    document.head.appendChild(style);
  }

  function createLink(id) {
    const link = document.createElement("a");
    link.id = id;
    link.className = "trh-admin-link";
    link.href = "admin-comments.html";
    link.textContent = "🔐 Admin";
    return link;
  }

  async function setupPrivateAdminLink() {
    const db = (typeof supabaseClient !== "undefined")
      ? supabaseClient
      : window.supabaseClient;

    if (!db) {
      console.error("Teacher Resource Hub: Supabase client not found.");
      return;
    }

    const { data: { user }, error: userError } =
      await db.auth.getUser();

    if (userError || !user) return;

    const { data, error } = await db
      .from("teacher_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Teacher Resource Hub: Admin check failed.", error);
      return;
    }

    if (!data || data.is_admin !== true) return;

    addAdminLinkStyles();

    const desktopNav = document.querySelector(".desktop-nav");
    const mobileNav = document.getElementById("mobileNav");

    if (desktopNav && !document.getElementById("trhDesktopAdminLink")) {
      const link = createLink("trhDesktopAdminLink");
      desktopNav.insertBefore(link, document.getElementById("accountButton"));
    }

    if (mobileNav && !document.getElementById("trhMobileAdminLink")) {
      const link = createLink("trhMobileAdminLink");
      link.onclick = function () {
        if (typeof closeMobileMenu === "function") closeMobileMenu();
      };
      mobileNav.insertBefore(link, document.getElementById("mobileAccountButton"));
    }
  }

  function start() {
    setupPrivateAdminLink().catch(function (error) {
      console.error("Teacher Resource Hub: Admin link error.", error);
    });

    const db = (typeof supabaseClient !== "undefined")
      ? supabaseClient
      : window.supabaseClient;

    if (db && db.auth) {
      db.auth.onAuthStateChange(function () {
        const oldDesktop = document.getElementById("trhDesktopAdminLink");
        const oldMobile = document.getElementById("trhMobileAdminLink");
        if (oldDesktop) oldDesktop.remove();
        if (oldMobile) oldMobile.remove();
        setupPrivateAdminLink().catch(function (error) {
          console.error("Teacher Resource Hub: Admin link refresh error.", error);
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
