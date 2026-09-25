/* =========================================================
   TEACHER RESOURCE HUB
   Premium Purple Educational Design
   ========================================================= */

:root {
  --purple-900: #2e1065;
  --purple-800: #4c1d95;
  --purple-700: #5b21b6;
  --purple-600: #6d28d9;
  --purple-500: #7c3aed;
  --purple-400: #8b5cf6;
  --purple-300: #a78bfa;
  --purple-100: #ede9fe;

  --ink: #181329;
  --muted: #706b80;
  --soft: #f8f7fc;
  --white: #ffffff;
  --border: rgba(76, 29, 149, 0.11);

  --shadow-sm: 0 8px 25px rgba(38, 16, 84, 0.07);
  --shadow-lg: 0 25px 70px rgba(38, 16, 84, 0.13);

  --radius-sm: 14px;
  --radius-md: 22px;
  --radius-lg: 32px;

  --max-width: 1180px;
}


/* ================= RESET ================= */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "DM Sans", sans-serif;
  color: var(--ink);
  background: var(--white);
  line-height: 1.6;
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}


/* ================= CONTAINER ================= */

.container {
  width: min(var(--max-width), calc(100% - 40px));
  margin-inline: auto;
}


/* ================= HEADER ================= */

.site-header {
  position: sticky;
  top: 0;
  z-index: 1000;

  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border-bottom: 1px solid rgba(76, 29, 149, 0.08);
}

.header-inner {
  min-height: 78px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
}

.brand-mark {
  width: 43px;
  height: 43px;

  display: grid;
  place-items: center;

  border-radius: 13px;

  color: white;
  font-size: 14px;
  font-weight: 800;

  background:
    linear-gradient(135deg, var(--purple-600), var(--purple-900));

  box-shadow:
    0 8px 22px rgba(109, 40, 217, 0.28);
}

.brand-text {
  display: flex;
  flex-direction: column;

  line-height: 1.05;
}

.brand-text strong {
  font-size: 16px;
  font-weight: 800;
}

.brand-text span {
  color: var(--purple-600);
  font-size: 13px;
  font-weight: 600;
}

#mainNav {
  display: flex;
  align-items: center;
  gap: 34px;
}

#mainNav a {
  position: relative;

  color: #514b60;
  font-size: 14px;
  font-weight: 600;

  transition: 0.25s ease;
}

#mainNav a:hover {
  color: var(--purple-600);
}

#mainNav a::after {
  content: "";

  position: absolute;
  left: 0;
  right: 0;
  bottom: -7px;

  height: 2px;

  background: var(--purple-600);

  transform: scaleX(0);
  transform-origin: center;

  transition: 0.25s ease;
}

#mainNav a:hover::after {
  transform: scaleX(1);
}

.menu-button {
  display: none;

  width: 43px;
  height: 43px;

  border: 0;
  border-radius: 12px;

  color: var(--purple-800);
  background: var(--purple-100);

  font-size: 21px;
}


/* ================= HERO ================= */

.hero {
  position: relative;
  min-height: 610px;

  display: flex;
  align-items: center;

  overflow: hidden;

  background:
    radial-gradient(
      circle at 15% 20%,
      rgba(139, 92, 246, 0.22),
      transparent 30%
    ),
    radial-gradient(
      circle at 85% 60%,
      rgba(124, 58, 237, 0.20),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #160b2f 0%,
      #291052 45%,
      #4c1d95 100%
    );

  color: white;
}

.hero::before {
  content: "";

  position: absolute;
  inset: 0;

  opacity: 0.18;

  background-image:
    radial-gradient(
      rgba(255,255,255,0.8) 1px,
      transparent 1px
    );

  background-size: 35px 35px;

  mask-image: linear-gradient(
    to right,
    black,
    transparent 80%
  );
}

.hero-glow {
  position: absolute;

  border-radius: 50%;
  filter: blur(2px);

  pointer-events: none;
}

.hero-glow-one {
  width: 350px;
  height: 350px;

  right: -100px;
  top: -100px;

  background: rgba(167, 139, 250, 0.18);
}

.hero-glow-two {
  width: 240px;
  height: 240px;

  left: 35%;
  bottom: -150px;

  background: rgba(255, 255, 255, 0.08);
}

.hero-inner {
  position: relative;
  z-index: 2;

  min-height: 610px;

  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 60px;
}

.hero-copy {
  max-width: 650px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 22px;

  color: #ddd0ff;

  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #c4b5fd;
  box-shadow: 0 0 15px #c4b5fd;
}

.hero h1 {
  max-width: 680px;

  margin-bottom: 23px;

  font-family: "Playfair Display", serif;
  font-size: clamp(45px, 6vw, 76px);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.hero h1 span {
  display: block;

  background:
    linear-gradient(
      90deg,
      #ffffff,
      #c4b5fd
    );

  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-copy p {
  max-width: 560px;

  margin-bottom: 32px;

  color: #d9d1e8;

  font-size: 17px;
  line-height: 1.75;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 15px;

  padding: 15px 21px;

  border-radius: 14px;

  color: var(--purple-900);
  background: white;

  font-size: 14px;
  font-weight: 800;

  box-shadow: 0 14px 35px rgba(0,0,0,0.18);

  transition: 0.25s ease;
}

.primary-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(0,0,0,0.25);
}

.primary-button span {
  font-size: 19px;
}


/* ================= HERO VISUAL ================= */

.hero-visual {
  position: relative;

  min-height: 430px;

  display: grid;
  place-items: center;
}

.hero-center-card {
  width: 260px;
  min-height: 315px;

  padding: 34px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 30px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,0.15),
      rgba(255,255,255,0.04)
    );

  box-shadow:
    0 30px 70px rgba(0,0,0,0.25),
    inset 0 1px 0 rgba(255,255,255,0.12);

  backdrop-filter: blur(20px);

  transform: rotate(3deg);
}

.hero-book-icon {
  width: 55px;
  height: 55px;

  display: grid;
  place-items: center;

  border-radius: 17px;

  background: rgba(255,255,255,0.12);

  color: #ddd0ff;

  font-size: 25px;
}

.hero-center-card > span {
  margin-top: 40px;

  color: #c4b5fd;

  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.hero-center-card strong {
  font-family: "Playfair Display", serif;

  font-size: 34px;
  line-height: 1.05;
}

.floating-card {
  position: absolute;

  display: flex;
  align-items: center;
  gap: 11px;

  padding: 13px 16px;

  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 15px;

  background: rgba(255,255,255,0.1);

  backdrop-filter: blur(18px);

  box-shadow: 0 20px 40px rgba(0,0,0,0.18);
}

.floating-card strong,
.floating-card small {
  display: block;
}

.floating-card strong {
  font-size: 12px;
}

.floating-card small {
  color: #cfc5df;
  font-size: 9px;
}

.mini-icon {
  width: 33px;
  height: 33px;

  display: grid;
  place-items: center;

  border-radius: 10px;

  background: rgba(255,255,255,0.12);
}

.card-one {
  top: 65px;
  left: -5px;
}

.card-two {
  right: -5px;
  bottom: 65px;
}


/* ================= SEARCH ================= */

.search-section {
  position: relative;
  z-index: 5;

  margin-top: -45px;
}

.search-panel {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  align-items: center;
  gap: 25px;

  padding: 22px 24px;

  border: 1px solid rgba(76,29,149,0.09);
  border-radius: 22px;

  background: rgba(255,255,255,0.96);

  box-shadow: var(--shadow-lg);

  backdrop-filter: blur(20px);
}

.search-heading {
  display: flex;
  align-items: center;
  gap: 13px;
}

.search-heading > span {
  width: 43px;
  height: 43px;

  display: grid;
  place-items: center;

  border-radius: 13px;

  color: var(--purple-700);
  background: var(--purple-100);

  font-size: 23px;
}

.search-heading strong,
.search-heading small {
  display: block;
}

.search-heading strong {
  font-size: 14px;
}

.search-heading small {
  margin-top: 2px;

  color: var(--muted);

  font-size: 11px;
}

.search-input-wrap {
  position: relative;
}

.search-input-wrap input {
  width: 100%;

  padding: 15px 45px 15px 18px;

  border: 1px solid #e5e0ed;
  border-radius: 13px;

  outline: none;

  color: var(--ink);
  background: #fbfaff;

  font-size: 13px;

  transition: 0.2s ease;
}

.search-input-wrap input:focus {
  border-color: var(--purple-400);

  box-shadow:
    0 0 0 4px rgba(124,58,237,0.08);
}

#clearSearch {
  position: absolute;

  right: 8px;
  top: 50%;

  width: 32px;
  height: 32px;

  transform: translateY(-50%);

  border: 0;
  border-radius: 9px;

  color: #8b8497;
  background: transparent;

  font-size: 21px;

  opacity: 0;
  pointer-events: none;

  transition: 0.2s;
}

#clearSearch.visible {
  opacity: 1;
  pointer-events: auto;
}


/* ================= SECTION ================= */

.classes-section {
  padding: 100px 0 60px;
}

.section-intro {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 40px;

  margin-bottom: 34px;
}

.section-kicker {
  display: inline-block;

  margin-bottom: 8px;

  color: var(--purple-600);

  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.section-intro h2 {
  font-family: "Playfair Display", serif;

  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.05;

  letter-spacing: -0.03em;
}

.section-intro p {
  max-width: 400px;

  color: var(--muted);

  font-size: 13px;
}


/* ================= CLASS CARDS ================= */

.class-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.class-card {
  position: relative;

  min-height: 185px;

  padding: 25px;

  overflow: hidden;

  border: 1px solid var(--border);
  border-radius: var(--radius-md);

  background: white;

  box-shadow: var(--shadow-sm);

  cursor: pointer;

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.class-card::before {
  content: "";

  position: absolute;

  width: 160px;
  height: 160px;

  right: -60px;
  bottom: -70px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      rgba(124,58,237,0.16),
      transparent 70%
    );

  transition: 0.3s ease;
}

.class-card:hover {
  transform: translateY(-7px);

  border-color: rgba(124,58,237,0.25);

  box-shadow:
    0 25px 55px rgba(76,29,149,0.13);
}

.class-card:hover::before {
  transform: scale(1.5);
}

.class-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 47px;
  height: 47px;

  margin-bottom: 22px;

  border-radius: 14px;

  color: white;

  background:
    linear-gradient(
      135deg,
      var(--purple-500),
      var(--purple-800)
    );

  font-size: 14px;
  font-weight: 800;

  box-shadow:
    0 10px 24px rgba(109,40,217,0.25);
}

.class-card h3 {
  position: relative;
  z-index: 1;

  margin-bottom: 3px;

  font-size: 18px;
}

.class-card p {
  position: relative;
  z-index: 1;

  color: var(--muted);

  font-size: 11px;
}

.class-arrow {
  position: absolute;

  right: 22px;
  top: 25px;

  color: var(--purple-500);

  font-size: 22px;

  transition: 0.25s;
}

.class-card:hover .class-arrow {
  transform: translateX(5px);
}


/* ================= ADS ================= */

.ad-section {
  padding: 20px 0 70px;
}

.ad-box {
  min-height: 90px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px dashed #d9d2e5;
  border-radius: 16px;

  color: #aaa3b2;

  background: #fbfaff;

  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
}


/* ================= LIBRARY ================= */

.library-section {
  padding: 0 0 100px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  min-height: 28px;

  margin-bottom: 25px;

  color: var(--muted);

  font-size: 12px;
}

.breadcrumb button {
  border: 0;
  background: transparent;

  color: var(--purple-600);

  font-weight: 700;
}

.breadcrumb .separator {
  color: #c2bbc9;
}

.library-header {
  display: flex;
  align-items: end;
  justify-content: space-between;

  gap: 30px;

  margin-bottom: 30px;
}

.library-header h2 {
  margin-top: 4px;

  font-family: "Playfair Display", serif;

  font-size: clamp(30px, 4vw, 44px);
  line-height: 1.05;
}

.library-header p {
  max-width: 430px;

  color: var(--muted);

  font-size: 13px;
}


/* ================= SUBJECT / TERM CARDS ================= */

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.navigation-card {
  position: relative;

  min-height: 160px;

  padding: 24px;

  border: 1px solid var(--border);
  border-radius: 22px;

  background:
    linear-gradient(
      145deg,
      #ffffff,
      #faf8ff
    );

  box-shadow: var(--shadow-sm);

  cursor: pointer;

  transition: 0.3s ease;
}

.navigation-card:hover {
  transform: translateY(-6px);

  border-color: rgba(124,58,237,0.24);

  box-shadow:
    0 22px 50px rgba(76,29,149,0.12);
}

.navigation-icon {
  width: 45px;
  height: 45px;

  display: grid;
  place-items: center;

  margin-bottom: 20px;

  border-radius: 13px;

  color: var(--purple-700);

  background: var(--purple-100);

  font-size: 19px;
}

.navigation-card h3 {
  margin-bottom: 4px;

  font-size: 16px;
}

.navigation-card p {
  color: var(--muted);

  font-size: 11px;
}

.navigation-arrow {
  position: absolute;

  right: 20px;
  top: 20px;

  color: var(--purple-500);

  font-size: 19px;
}


/* ================= WEEK CARDS ================= */

.week-list {
  display: grid;
  gap: 13px;
}

.week-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 19px 21px;

  border: 1px solid var(--border);
  border-radius: 17px;

  background: white;

  box-shadow: 0 5px 20px rgba(38,16,84,0.045);

  transition: 0.25s ease;
}

.week-card:hover {
  transform: translateX(4px);

  border-color: rgba(124,58,237,0.22);

  box-shadow: var(--shadow-sm);
}

.week-info {
  display: flex;
  align-items: center;
  gap: 15px;

  min-width: 0;
}

.week-number {
  flex-shrink: 0;

  width: 43px;
  height: 43px;

  display: grid;
  place-items: center;

  border-radius: 12px;

  color: var(--purple-700);
  background: var(--purple-100);

  font-size: 11px;
  font-weight: 800;
}

.week-info h3 {
  font-size: 14px;
}

.week-info p {
  margin-top: 2px;

  color: var(--muted);

  font-size: 11px;
}

.resource-actions {
  display: flex;
  gap: 8px;

  flex-shrink: 0;
}

.download-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 9px 12px;

  border-radius: 10px;

  color: var(--purple-700);
  background: var(--purple-100);

  font-size: 10px;
  font-weight: 800;

  transition: 0.2s;
}

.download-button:hover {
  color: white;
  background: var(--purple-600);
}

.download-button.notes {
  color: #fff;
  background: var(--purple-600);
}

.download-button.notes:hover {
  background: var(--purple-800);
}


/* ================= EMPTY STATE ================= */

.empty-state {
  padding: 65px 25px;

  text-align: center;

  border: 1px dashed #dcd5e8;
  border-radius: 22px;

  background: #fbfaff;
}

.empty-icon {
  width: 55px;
  height: 55px;

  display: grid;
  place-items: center;

  margin: 0 auto 15px;

  border-radius: 16px;

  color: var(--purple-600);
  background: var(--purple-100);

  font-size: 24px;
}

.empty-state h3 {
  margin-bottom: 5px;

  font-family: "Playfair Display", serif;

  font-size: 24px;
}

.empty-state p {
  color: var(--muted);

  font-size: 12px;
}


/* ================= ABOUT ================= */

.about-section {
  padding: 20px 0 100px;
}

.about-card {
  position: relative;

  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 40px;

  padding: 55px;

  overflow: hidden;

  border-radius: var(--radius-lg);

  color: white;

  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(167,139,250,0.3),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #24103f,
      #4c1d95
    );

  box-shadow: var(--shadow-lg);
}

.about-mark {
  width: 105px;
  height: 105px;

  display: grid;
  place-items: center;

  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 30px;

  background: rgba(255,255,255,0.08);

  font-size: 27px;
  font-weight: 800;
}

.about-content .section-kicker {
  color: #c4b5fd;
}

.about-content h2 {
  max-width: 700px;

  margin-bottom: 15px;

  font-family: "Playfair Display", serif;

  font-size: clamp(30px, 4vw, 45px);
  line-height: 1.05;
}

.about-content h2 span {
  color: #c4b5fd;
}

.about-content p {
  max-width: 700px;

  color: #d9d1e8;

  font-size: 13px;
  line-height: 1.8;
}


/* ================= FOOTER ================= */

.site-footer {
  padding: 45px 0 25px;

  border-top: 1px solid #eeeaf4;

  background: #fbfaff;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 40px;

  padding-bottom: 30px;
}

.footer-brand p {
  margin-top: 13px;

  color: var(--muted);

  font-size: 11px;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 25px;
}

.footer-links a {
  color: var(--muted);

  font-size: 11px;
  font-weight: 600;
}

.footer-links a:hover {
  color: var(--purple-600);
}

.footer-bottom {
  padding-top: 20px;

  border-top: 1px solid #eeeaf4;

  color: #9991a4;

  font-size: 10px;
}


/* ================= SEARCH RESULTS ================= */

.search-results-title {
  margin-bottom: 20px;

  font-family: "Playfair Display", serif;

  font-size: 30px;
}

.search-result-card {
  margin-bottom: 12px;
}


/* ================= ANIMATION ================= */

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeUp 0.4s ease both;
}


/* ================= RESPONSIVE ================= */

@media (max-width: 900px) {

  .hero-inner {
    grid-template-columns: 1fr;
    padding: 75px 0;
  }

  .hero {
    min-height: auto;
  }

  .hero-inner {
    min-height: auto;
  }

  .hero-copy {
    text-align: center;
    margin-inline: auto;
  }

  .hero-copy p {
    margin-inline: auto;
  }

  .hero-visual {
    min-height: 350px;
    max-width: 500px;
    width: 100%;
    margin-inline: auto;
  }

  .search-panel {
    grid-template-columns: 1fr;
  }

  .class-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .navigation-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-intro,
  .library-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .about-card {
    grid-template-columns: 1fr;
  }

}


@media (max-width: 650px) {

  .container {
    width: min(100% - 28px, var(--max-width));
  }

  .header-inner {
    min-height: 68px;
  }

  .menu-button {
    display: grid;
    place-items: center;
  }

  #mainNav {
    position: absolute;

    top: 68px;
    left: 14px;
    right: 14px;

    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0;

    padding: 8px;

    border: 1px solid var(--border);
    border-radius: 16px;

    background: white;

    box-shadow: var(--shadow-lg);
  }

  #mainNav.open {
    display: flex;
  }

  #mainNav a {
    padding: 12px 14px;
    border-radius: 10px;
  }

  #mainNav a:hover {
    background: var(--purple-100);
  }

  #mainNav a::after {
    display: none;
  }

  .hero {
    min-height: 680px;
  }

  .hero-inner {
    padding-top: 60px;
  }

  .hero h1 {
    font-size: 48px;
  }

  .hero-copy p {
    font-size: 14px;
  }

  .hero-visual {
    min-height: 280px;
  }

  .hero-center-card {
    width: 205px;
    min-height: 245px;
    padding: 25px;
  }

  .hero-center-card strong {
    font-si
