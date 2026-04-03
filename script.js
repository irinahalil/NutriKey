const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const runRevealAnimations = function () {
  const revealTargets = document.querySelectorAll(
    ".section .card, .section h2, .section .section-intro, .quote, .cta-box"
  );

  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach(function (el) {
    observer.observe(el);
  });
};

const initScrollSpy = function () {
  const main = document.getElementById("main-content");
  if (!main) return;

  const sections = Array.from(main.querySelectorAll(":scope > section.section"));
  if (!sections.length) return;

  const update = function () {
    const anchorY = window.innerHeight * 0.36;
    let best = null;
    let bestScore = -Infinity;

    sections.forEach(function (section) {
      const rect = section.getBoundingClientRect();
      const visibleTop = Math.min(window.innerHeight, Math.max(0, rect.top));
      const visibleBottom = Math.max(0, Math.min(window.innerHeight, rect.bottom));
      const visibleH = Math.max(0, visibleBottom - visibleTop);
      if (visibleH < 24) return;

      const sectionCenter = rect.top + rect.height / 2;
      const dist = Math.abs(sectionCenter - anchorY);
      const ratio = visibleH / Math.max(rect.height, 1);
      const score = ratio * 120 - dist * 0.15;

      if (score > bestScore) {
        bestScore = score;
        best = section;
      }
    });

    sections.forEach(function (section) {
      section.classList.toggle("section-is-active", section === best);
    });
  };

  update();

  let ticking = false;
  const onScrollOrResize = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
};

const runHeroIntroAnimation = function () {
  const heroContent = document.querySelector(".hero-content");
  if (!heroContent) return;

  heroContent.classList.add("hero-animate");

  if (reduceMotion) {
    heroContent.classList.add("is-visible");
    return;
  }

  requestAnimationFrame(function () {
    heroContent.classList.add("is-visible");
  });
};

const pulseCalculatorOnJump = function () {
  const calcBtn = document.getElementById("hero-calc-btn");
  const calculatorSection = document.getElementById("calculator");
  if (!calcBtn || !calculatorSection) return;

  calcBtn.addEventListener("click", function () {
    calculatorSection.classList.remove("calculator-pulse");
    window.setTimeout(function () {
      calculatorSection.classList.add("calculator-pulse");
    }, 120);

    window.setTimeout(function () {
      calculatorSection.classList.remove("calculator-pulse");
    }, 1700);
  });
};

const animateCountValues = function (container) {
  const counters = container.querySelectorAll("[data-count-target]");
  if (!counters.length) return;

  counters.forEach(function (el) {
    const target = Number(el.getAttribute("data-count-target")) || 0;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }

    const duration = 900;
    const startAt = performance.now();

    const tick = function (now) {
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  });
};

const initTestimonialsCarousel = function () {
  const track = document.getElementById("testimonials-track");
  const prevBtn = document.getElementById("testimonial-prev");
  const nextBtn = document.getElementById("testimonial-next");
  const dotsRoot = document.getElementById("testimonial-dots");

  if (!track || !dotsRoot) return;

  const slides = Array.from(track.querySelectorAll(".testimonial-slide"));
  const dots = Array.from(dotsRoot.querySelectorAll(".testimonial-dot"));

  if (!slides.length) return;

  let currentIndex = 0;

  const render = function () {
    track.style.transform = "translateX(-" + currentIndex * 100 + "%)";

    dots.forEach(function (dot, index) {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  };

  const goTo = function (index) {
    currentIndex = (index + slides.length) % slides.length;
    render();
  };

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      goTo(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      goTo(currentIndex + 1);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      const index = Number(dot.getAttribute("data-index"));
      if (!Number.isNaN(index)) {
        goTo(index);
      }
    });
  });

  let touchStartX = 0;

  track.addEventListener(
    "touchstart",
    function (event) {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    function (event) {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) < 40) return;
      goTo(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
    },
    { passive: true }
  );

  render();
};

const initStaggeredMenu = function () {
  const root = document.getElementById("staggered-menu-root");
  const toggle = document.getElementById("staggered-menu-toggle");
  const panel = document.getElementById("staggered-menu-panel");
  const backdrop = document.getElementById("staggered-menu-backdrop");
  const icon = document.getElementById("sm-menu-icon");
  const label = document.getElementById("menu-toggle-label");
  if (!root || !toggle || !panel || !backdrop) return;

  const header = document.querySelector(".header");
  const position = root.getAttribute("data-position") === "left" ? "left" : "right";
  const offscreen = position === "left" ? -100 : 100;
  const preLayers = Array.from(root.querySelectorAll(".sm-prelayer"));
  const itemLabels = Array.from(panel.querySelectorAll(".sm-panel-itemLabel"));
  const numberEls = Array.from(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"));
  const socialTitle = panel.querySelector(".sm-socials-title");
  const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link"));
  const hasGsap = typeof window.gsap !== "undefined";

  let open = false;
  let busy = false;
  let openTl = null;
  let closeTween = null;

  if (!hasGsap) {
    root.classList.add("sm-css-only");
  }

  const getMenuStrings = function () {
    return {
      open: label?.dataset.menuOpen || "Меню",
      close: label?.dataset.menuClose || "Закрыть",
    };
  };

  const syncLabel = function () {
    const s = getMenuStrings();
    if (label) label.textContent = open ? s.close : s.open;
    const openAria = toggle.dataset.menuCloseAria || s.close;
    const closedAria = toggle.dataset.menuOpenAria || s.open;
    toggle.setAttribute("aria-label", open ? openAria : closedAria);
  };

  const setAria = function () {
    root.setAttribute("aria-hidden", open ? "false" : "true");
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    backdrop.setAttribute("tabindex", open ? "0" : "-1");
    syncLabel();
  };

  if (hasGsap) {
    gsap.set([panel].concat(preLayers), { xPercent: offscreen });
    gsap.set(backdrop, { autoAlpha: 0, pointerEvents: "none" });
    if (icon) gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
    if (itemLabels.length) gsap.set(itemLabels, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { "--sm-num-opacity": 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
  }

  const playOpen = function () {
    if (busy || open) return;
    busy = true;
    open = true;
    root.setAttribute("data-open", "true");
    document.body.style.overflow = "hidden";
    if (header) header.style.zIndex = "110";
    setAria();

    if (!hasGsap) {
      busy = false;
      if (icon) icon.style.transform = "rotate(225deg)";
      return;
    }

    openTl?.kill();
    closeTween?.kill();
    closeTween = null;

    const layerStates = preLayers.map(function (el) {
      return { el: el, start: Number(gsap.getProperty(el, "xPercent")) };
    });
    const panelStart = Number(gsap.getProperty(panel, "xPercent"));

    if (itemLabels.length) gsap.set(itemLabels, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { "--sm-num-opacity": 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    gsap.killTweensOf(backdrop);
    gsap.to(backdrop, {
      autoAlpha: 1,
      pointerEvents: "auto",
      duration: 0.35,
      ease: "power2.out",
    });

    const tl = gsap.timeline({
      onComplete: function () {
        busy = false;
      },
    });

    layerStates.forEach(function (ls, i) {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.5, ease: "power4.out" },
        i * 0.07
      );
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime
    );

    if (itemLabels.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemLabels,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: "power4.out",
          stagger: { each: 0.1, from: "start" },
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: "power2.out",
            "--sm-num-opacity": 1,
            stagger: { each: 0.08, from: "start" },
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: "power2.out" }, socialsStart);
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
            onComplete: function () {
              gsap.set(socialLinks, { clearProps: "opacity" });
            },
          },
          socialsStart + 0.04
        );
      }
    }

    openTl = tl;

    if (icon) {
      gsap.to(icon, { rotate: 225, duration: 0.8, ease: "power4.out", overwrite: "auto" });
    }
  };

  const playClose = function () {
    if (!open) return;
    if (hasGsap) {
      openTl?.kill();
      openTl = null;
      busy = false;
    }
    busy = true;
    open = false;
    root.removeAttribute("data-open");
    document.body.style.overflow = "";
    if (header) header.style.zIndex = "";
    setAria();

    if (!hasGsap) {
      if (icon) icon.style.transform = "rotate(0deg)";
      busy = false;
      return;
    }

    gsap.killTweensOf(backdrop);
    gsap.to(backdrop, {
      autoAlpha: 0,
      pointerEvents: "none",
      duration: 0.25,
      ease: "power2.in",
    });

    const all = preLayers.concat([panel]);
    closeTween?.kill();
    closeTween = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: function () {
        if (itemLabels.length) gsap.set(itemLabels, { yPercent: 140, rotate: 10 });
        if (numberEls.length) gsap.set(numberEls, { "--sm-num-opacity": 0 });
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        busy = false;
      },
    });

    if (icon) {
      gsap.to(icon, { rotate: 0, duration: 0.35, ease: "power3.inOut", overwrite: "auto" });
    }
  };

  const toggleMenu = function () {
    if (open) playClose();
    else playOpen();
  };

  toggle.addEventListener("click", toggleMenu);
  backdrop.addEventListener("click", function () {
    if (open) playClose();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) playClose();
  });

  panel.querySelectorAll("a[data-sm-anchor]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      const href = link.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      e.preventDefault();
      playClose();
      window.setTimeout(function () {
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }, hasGsap ? 340 : 50);
    });
  });

  window.__nutrikeyMenuSync = syncLabel;
  window.__nutrikeyCloseMenu = function () {
    if (open) playClose();
  };
};

runRevealAnimations();
runHeroIntroAnimation();
pulseCalculatorOnJump();
initScrollSpy();
initTestimonialsCarousel();
initStaggeredMenu();

const TELEGRAM_CONTACT_BASE = "https://t.me/Neiro_ira11";

const initContactModal = function () {
  const modal = document.getElementById("contact-modal");
  const backdrop = document.getElementById("contact-modal-backdrop");
  const closeBtn = document.getElementById("contact-modal-close");
  const form = document.getElementById("contact-form");
  const errEl = document.getElementById("contact-form-error");
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const phoneInput = document.getElementById("contact-phone");
  const consentInput = document.getElementById("contact-consent");

  if (!modal || !form || !backdrop || !closeBtn) return;

  let lastFocus = null;

  const showError = function (message) {
    if (!errEl) return;
    errEl.textContent = message;
    errEl.hidden = false;
  };

  const hideError = function () {
    if (!errEl) return;
    errEl.hidden = true;
    errEl.textContent = "";
  };

  const validPhone = function (value) {
    const digits = String(value).replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  };

  const buildTelegramUrl = function () {
    const intro = form.dataset.msgIntro || "NutriKey";
    const ln = form.dataset.msgName || "Name";
    const le = form.dataset.msgEmail || "Email";
    const lp = form.dataset.msgPhone || "Phone";
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const text = `${intro}\n\n${ln}: ${name}\n${le}: ${email}\n${lp}: ${phone}`;
    return `${TELEGRAM_CONTACT_BASE}?text=${encodeURIComponent(text)}`;
  };

  const closeModal = function () {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("contact-modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
    lastFocus = null;
  };

  const openModal = function () {
    hideError();
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("contact-modal-open");
    window.setTimeout(function () {
      if (nameInput) nameInput.focus();
    }, 10);
  };

  const onOpenClick = function (e) {
    e.preventDefault();
    if (window.__nutrikeyCloseMenu) window.__nutrikeyCloseMenu();
    openModal();
  };

  document.getElementById("nav-telegram-btn")?.addEventListener("click", onOpenClick);
  document.getElementById("cta-contact-btn")?.addEventListener("click", onOpenClick);

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  form.addEventListener("input", hideError);
  form.addEventListener("change", function (ev) {
    if (ev.target === consentInput) hideError();
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modal.classList.contains("is-open")) {
      ev.preventDefault();
      closeModal();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideError();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !email || !phone) {
      showError(form.dataset.errRequired || "");
      return;
    }

    if (name.length < 2) {
      showError(form.dataset.errRequired || "");
      return;
    }

    if (!emailInput.checkValidity()) {
      showError(form.dataset.errEmail || "");
      emailInput.focus();
      return;
    }

    if (!validPhone(phone)) {
      showError(form.dataset.errPhone || "");
      phoneInput.focus();
      return;
    }

    if (!consentInput.checked) {
      showError(form.dataset.errConsent || "");
      consentInput.focus();
      return;
    }

    window.open(buildTelegramUrl(), "_blank", "noopener,noreferrer");
    form.reset();
    closeModal();
  });
};

initContactModal();

const calorieForm = document.getElementById("calorie-form");
const calorieResult = document.getElementById("calorie-result");

if (calorieForm && calorieResult) {
  calorieForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const gender = document.getElementById("gender").value;
    const age = Number(document.getElementById("age").value);
    const weight = Number(document.getElementById("weight").value);
    const height = Number(document.getElementById("height").value);
    const activity = Number(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    if (!age || !weight || !height || !activity) {
      calorieResult.innerHTML = `
        <div class="result-box">
          <p>Пожалуйста, заполните все поля.</p>
        </div>
      `;
      return;
    }

    let bmr = 0;

    // Формула Миффлина — Сан Жеора
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const maintenanceCalories = bmr * activity;

    let targetCalories = maintenanceCalories;
    let goalText = "Поддержание моего нынешнего веса";
    let goalComment = "Это ориентир для сохранения текущей формы.";

    if (goal === "lose_fast") {
      targetCalories = maintenanceCalories * 0.8;
      goalText = "Сброс веса";
      goalComment =
        "Заложен более выраженный дефицит относительно поддержания. Следите за самочувствием и при необходимости смягчайте режим.";
    }

    if (goal === "lose_slow") {
      targetCalories = maintenanceCalories * 0.9;
      goalText = "Медленный сброс веса";
      goalComment =
        "Заложен мягкий дефицит относительно поддержания без жёсткого урезания калорий.";
    }

    if (goal === "gain_slow") {
      targetCalories = maintenanceCalories * 1.07;
      goalText = "Медленное увеличение веса";
      goalComment =
        "Заложен умеренный профицит относительно поддержания, его можно корректировать по динамике.";
    }

    if (goal === "gain_fast") {
      targetCalories = maintenanceCalories * 1.15;
      goalText = "Увеличение веса";
      goalComment =
        "Заложен более высокий профицит относительно поддержания. Оценивайте динамику веса и самочувствие.";
    }

    // БЖУ
    const proteinGrams = weight * 1.8;
    const fatGrams = weight * 0.9;

    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = carbCalories > 0 ? carbCalories / 4 : 0;

    const roundedBmr = Math.round(bmr);
    const roundedMaintenance = Math.round(maintenanceCalories);
    const roundedTarget = Math.round(targetCalories);
    const roundedProtein = Math.round(proteinGrams);
    const roundedFat = Math.round(fatGrams);
    const roundedCarbs = Math.max(0, Math.round(carbGrams));

    calorieResult.innerHTML = `
      <div class="result-box result-enter">
        <h3>Ваш ориентировочный результат</h3>
        <p><strong>Базовый обмен:</strong> <span data-count-target="${roundedBmr}">0</span> ккал</p>
        <p><strong>Калорийность с учётом активности:</strong> <span data-count-target="${roundedMaintenance}">0</span> ккал</p>
        <p><strong>Цель:</strong> ${goalText}</p>
        <p><strong>Рекомендуемая калорийность:</strong> <span data-count-target="${roundedTarget}">0</span> ккал</p>
        <p><strong>Белки:</strong> <span data-count-target="${roundedProtein}">0</span> г</p>
        <p><strong>Жиры:</strong> <span data-count-target="${roundedFat}">0</span> г</p>
        <p><strong>Углеводы:</strong> <span data-count-target="${roundedCarbs}">0</span> г</p>
        <p class="result-note">${goalComment}</p>
        <p class="result-note">
          При выраженном голоде, слабости или плато расчёт лучше корректировать индивидуально.
        </p>
      </div>
    `;

    const resultBox = calorieResult.querySelector(".result-box");
    if (resultBox) {
      animateCountValues(resultBox);
    }
  });
}
