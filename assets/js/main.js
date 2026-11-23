/* ==========================================================================
   Main Interactive Behavior — Juan Manuel Rossi 2027 Portfolio
   Theme toggle, bilingual EN/ES switch, mobile nav drawer, filters,
   copy-email feedback, and native <dialog> screenshot lightbox.
   ========================================================================== */
(function () {
  "use strict";

  const THEME_KEY = "jmr-theme";
  const LANG_KEY = "jmr-lang";
  const root = document.documentElement;

  const SUN_SVG =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5"></circle>' +
    '<line x1="12" y1="1" x2="12" y2="3"></line>' +
    '<line x1="12" y1="21" x2="12" y2="23"></line>' +
    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
    '<line x1="1" y1="12" x2="3" y2="12"></line>' +
    '<line x1="21" y1="12" x2="23" y2="12"></line>' +
    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
    "</svg>";

  const MOON_SVG =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
    "</svg>";

  function getDict(lang) {
    const all = window.JMR_I18N || {};
    return all[lang] || all.en || {};
  }

  function getCurrentLang() {
    return root.getAttribute("lang") === "es" ? "es" : "en";
  }

  function getCurrentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateThemeButton() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = getCurrentTheme() === "dark";
    const dict = getDict(getCurrentLang());
    const label = isDark ? dict["theme.toLight"] || "Light" : dict["theme.toDark"] || "Dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.setAttribute("aria-label", dict["theme.aria"] || "Toggle theme");
    btn.innerHTML = (isDark ? SUN_SVG : MOON_SVG) + "<span>" + label + "</span>";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    updateThemeButton();
  }

  function applyLang(lang) {
    const target = lang === "es" ? "es" : "en";
    const dict = getDict(target);
    root.setAttribute("lang", target);

    const titleKey = root.getAttribute("data-page-title-key");
    if (titleKey && dict[titleKey]) {
      document.title = dict[titleKey];
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key && Object.prototype.hasOwnProperty.call(dict, key)) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (key && Object.prototype.hasOwnProperty.call(dict, key)) {
        el.setAttribute("aria-label", dict[key]);
      }
    });

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const active = btn.getAttribute("data-lang-btn") === target;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try {
      localStorage.setItem(LANG_KEY, target);
    } catch (e) {}

    updateThemeButton();
  }

  function initThemeAndLang() {
    let savedTheme = null;
    let savedLang = null;
    try {
      savedTheme = localStorage.getItem(THEME_KEY);
      savedLang = localStorage.getItem(LANG_KEY);
    } catch (e) {}

    const initialTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    applyTheme(initialTheme);
    applyLang(savedLang === "es" ? "es" : "en");

    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
      });
    }

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextLang = btn.getAttribute("data-lang-btn");
        if (nextLang) applyLang(nextLang);
      });
    });
  }

  function initMobileMenu() {
    const toggle = document.getElementById("menu-toggle");
    const drawer = document.getElementById("mobile-drawer");
    if (!toggle || !drawer) return;

    function closeMenu() {
      drawer.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      const dict = getDict(getCurrentLang());
      toggle.setAttribute("aria-label", dict["nav.menuOpen"] || "Open menu");
    }

    toggle.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      const dict = getDict(getCurrentLang());
      toggle.setAttribute(
        "aria-label",
        isOpen ? dict["nav.menuClose"] || "Close menu" : dict["nav.menuOpen"] || "Open menu"
      );
    });

    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  function initProjectFilters() {
    const buttons = Array.from(document.querySelectorAll("[data-project-filter]"));
    const cards = Array.from(document.querySelectorAll(".project-card"));
    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-project-filter") || "all";
        buttons.forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        cards.forEach((card) => {
          const cats = (card.getAttribute("data-categories") || "").split(/\s+/);
          const visible = filter === "all" || cats.includes(filter);
          card.classList.toggle("is-hidden", !visible);
        });
      });
    });
  }

  function initCopyEmail() {
    const copyBtn = document.getElementById("copy-email-btn");
    const status = document.getElementById("copy-feedback");
    if (!copyBtn || !status) return;

    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.getAttribute("data-email") || "juancho.256.8@gmail.com";
      const dict = getDict(getCurrentLang());
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          const input = document.createElement("input");
          input.value = email;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
        }
        status.textContent = dict["contact.copied"] || "Email copied: " + email;
      } catch (err) {
        status.textContent = email;
      }
      window.setTimeout(() => {
        status.textContent = "";
      }, 3600);
    });
  }

  function initLightbox() {
    const dialog = document.getElementById("img-lightbox");
    const imgEl = document.getElementById("lightbox-img");
    const titleEl = document.getElementById("lightbox-title");
    const closeBtn = document.getElementById("lightbox-close");
    if (!dialog || !imgEl || !titleEl) return;

    document.querySelectorAll("[data-lightbox-src]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const src = trigger.getAttribute("data-lightbox-src");
        const alt = trigger.getAttribute("data-lightbox-alt") || "";
        const capKey = trigger.getAttribute("data-lightbox-title-key");
        const dict = getDict(getCurrentLang());
        const caption = (capKey && dict[capKey]) || trigger.getAttribute("data-lightbox-title") || alt;

        imgEl.src = src;
        imgEl.alt = alt;
        titleEl.textContent = caption;

        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => dialog.close());
    }

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.close();
      }
    });

    dialog.addEventListener("close", () => {
      imgEl.removeAttribute("src");
    });
  }

  function initPrintButton() {
    const printBtn = document.getElementById("print-resume-btn");
    if (!printBtn) return;
    printBtn.addEventListener("click", () => window.print());
  }

  initThemeAndLang();
  initMobileMenu();
  initProjectFilters();
  initCopyEmail();
  initLightbox();
  initPrintButton();
})();
