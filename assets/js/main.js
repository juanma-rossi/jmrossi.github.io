/* ==========================================================================
   Main Interactive Behavior — Juan Manuel Rossi 2027 Portfolio
   System-first theme (prefers-color-scheme) + persistent manual override,
   bilingual EN/ES switch, live Buenos Aires ART clock, scroll progress line,
   active nav tracking, subtle metric counters, progressive reveals,
   mobile drawer, project filters, copy email, and native <dialog> lightbox.
   ========================================================================== */
(function () {
  "use strict";

  const THEME_KEY = "jmr-theme";
  const LANG_KEY = "jmr-lang";
  const root = document.documentElement;
  const darkMql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const reducedMotionMql = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  const SUN_SVG =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
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
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
    "</svg>";

  function getDict(lang) {
    const all = window.JMR_I18N || {};
    return all[lang] || all.en || {};
  }

  function getCurrentLang() {
    return root.getAttribute("lang") === "es" ? "es" : "en";
  }

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    return null;
  }

  function getEffectiveTheme() {
    const saved = getSavedTheme();
    if (saved) return saved;
    return darkMql && darkMql.matches ? "dark" : "light";
  }

  function updateThemeButton() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = getEffectiveTheme() === "dark";
    const dict = getDict(getCurrentLang());
    const label = isDark ? dict["theme.toLight"] || "Light" : dict["theme.toDark"] || "Dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.setAttribute("aria-label", dict["theme.aria"] || "Toggle theme");
    btn.innerHTML = (isDark ? SUN_SVG : MOON_SVG) + "<span>" + label + "</span>";
  }

  function applyTheme(theme, persist) {
    if (persist) {
      root.classList.add("theme-switching");
      root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
      void root.offsetHeight;
      try {
        localStorage.setItem(THEME_KEY, theme === "dark" ? "dark" : "light");
      } catch (e) {}
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          root.classList.remove("theme-switching");
        });
      });
    } else {
      root.removeAttribute("data-theme");
    }
    updateThemeButton();
  }

  function applyLang(lang, persist) {
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

    if (persist) {
      try {
        localStorage.setItem(LANG_KEY, target);
      } catch (e) {}
    }

    updateThemeButton();
  }

  function initThemeAndLang() {
    const savedTheme = getSavedTheme();
    if (savedTheme) {
      applyTheme(savedTheme, true);
    } else {
      applyTheme(getEffectiveTheme(), false);
    }

    let savedLang = null;
    try {
      savedLang = localStorage.getItem(LANG_KEY);
    } catch (e) {}
    applyLang(savedLang === "es" ? "es" : "en", false);

    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = getEffectiveTheme() === "dark" ? "light" : "dark";
        applyTheme(next, true);
      });
    }

    if (darkMql) {
      const onOsThemeChange = () => {
        if (!getSavedTheme()) {
          updateThemeButton();
        }
      };
      if (typeof darkMql.addEventListener === "function") {
        darkMql.addEventListener("change", onOsThemeChange);
      } else if (typeof darkMql.addListener === "function") {
        darkMql.addListener(onOsThemeChange);
      }
    }

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextLang = btn.getAttribute("data-lang-btn");
        if (nextLang) applyLang(nextLang, true);
      });
    });
  }

  function initLocalClock() {
    const el = document.querySelector("[data-ba-clock]");
    if (!el) return;

    function renderTime() {
      try {
        const fmt = new Intl.DateTimeFormat("en-GB", {
          timeZone: "America/Argentina/Buenos_Aires",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
        el.textContent = fmt.format(new Date()) + " ART";
      } catch (e) {
        el.textContent = "ART";
      }
    }

    renderTime();
    window.setInterval(renderTime, 30000);
  }

  function initScrollProgress() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let ticking = false;
    function update() {
      ticking = false;
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      header.style.setProperty("--scroll-progress", ratio.toFixed(4));
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  function initActiveNav() {
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (!links.length || typeof IntersectionObserver !== "function") return;

    const pairs = links
      .map((link) => {
        const id = link.getAttribute("href").slice(1);
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    if (!pairs.length) return;

    const setActive = (activeLink) => {
      links.forEach((l) => l.classList.toggle("is-active", l === activeLink));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          const match = pairs.find((p) => p.section === visible[0].target);
          if (match) setActive(match.link);
        }
      },
      { rootMargin: "-22% 0px -58% 0px", threshold: [0.05, 0.25, 0.5] }
    );

    pairs.forEach((p) => observer.observe(p.section));
  }

  function initMetricCounters() {
    const nodes = Array.from(document.querySelectorAll("[data-count-to]"));
    if (!nodes.length) return;
    if (
      (reducedMotionMql && reducedMotionMql.matches) ||
      typeof IntersectionObserver !== "function"
    ) {
      return;
    }

    const animateNode = (el) => {
      const target = parseInt(el.getAttribute("data-count-to"), 10);
      if (Number.isNaN(target) || target <= 0) return;
      const suffix = el.getAttribute("data-count-suffix") || "";
      const duration = 680;
      const start = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.max(1, Math.round(eased * target));
        el.textContent = current + suffix;
        if (t < 1) {
          window.requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix;
        }
      }
      window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateNode(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    nodes.forEach((el) => observer.observe(el));
  }

  function initScrollReveal() {
    if (
      (reducedMotionMql && reducedMotionMql.matches) ||
      typeof IntersectionObserver !== "function"
    ) {
      return;
    }

    const targets = Array.from(
      document.querySelectorAll(
        ".track-cell, .flagship-spread, .work-row, .exp-entry, .spec-row, .cred-row, .contact-panel, .arch-block, .doc-card"
      )
    );
    if (!targets.length) return;

    root.classList.add("js-motion");

    targets.forEach((el, idx) => {
      el.classList.add("js-reveal");
      const delay = (idx % 3) * 30;
      el.style.setProperty("--reveal-delay", delay + "ms");
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.98) {
        el.classList.add("is-visible");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "120px 0px 120px 0px", threshold: 0.01 }
    );

    targets.forEach((el) => {
      if (!el.classList.contains("is-visible")) {
        observer.observe(el);
      }
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
    const rows = Array.from(document.querySelectorAll(".work-row"));
    if (!buttons.length || !rows.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-project-filter") || "all";
        buttons.forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        rows.forEach((row) => {
          const cats = (row.getAttribute("data-categories") || "").split(/\s+/);
          const visible = filter === "all" || cats.includes(filter);
          row.classList.toggle("is-hidden", !visible);
          if (visible) {
            row.classList.add("is-visible");
          }
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
  initLocalClock();
  initScrollProgress();
  initActiveNav();
  initMetricCounters();
  initScrollReveal();
  initMobileMenu();
  initProjectFilters();
  initCopyEmail();
  initLightbox();
  initPrintButton();
})();
