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

runRevealAnimations();
runHeroIntroAnimation();
pulseCalculatorOnJump();
initTestimonialsCarousel();

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
