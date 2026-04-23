(function () {
  "use strict";

  var cfg = window.NUTRI_CMS || {};
  var page = document.body.getAttribute("data-auth-page");

  function setText(id, text, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = el.className.replace(/\s?(ok|error)\b/g, "");
    if (cls) el.classList.add(cls);
    el.textContent = text;
  }

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    if (page === "login") setText("auth-status", "Не заполнен cms-config.js", "error");
    if (page === "cabinet") setText("cabinet-status", "Не заполнен cms-config.js", "error");
    return;
  }

  var supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  async function getSession() {
    var r = await supabase.auth.getSession();
    return (r.data && r.data.session) || null;
  }

  function v(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setV(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value == null ? "" : String(value);
  }

  async function runLoginPage() {
    var session = await getSession();
    if (session) {
      await redirectByProfile(session.user.id);
      return;
    }

    document.getElementById("auth-form")?.addEventListener("submit", async function (event) {
      event.preventDefault();
      var email = v("auth-email");
      var password = v("auth-password");
      setText("auth-status", "Вхожу...", "");

      var r = await supabase.auth.signInWithPassword({ email: email, password: password });
      if (r.error) {
        setText("auth-status", r.error.message, "error");
        return;
      }
      setText("auth-status", "Вход выполнен.", "ok");
      await redirectByProfile(r.data.session.user.id);
    });

    document.getElementById("register-btn")?.addEventListener("click", async function () {
      var email = v("auth-email");
      var password = v("auth-password");
      setText("auth-status", "Регистрирую...", "");

      var r = await supabase.auth.signUp({ email: email, password: password });
      if (r.error) {
        setText("auth-status", r.error.message, "error");
        return;
      }
      setText(
        "auth-status",
        "Аккаунт создан. Теперь войдите с вашим логином (email) и паролем.",
        "ok"
      );
    });
  }

  async function loadProfile(userId) {
    var r = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }

  async function saveProfile(userId) {
    var payload = {
      id: userId,
      full_name: v("profile-full-name"),
      age: Number(v("profile-age")) || null,
      height_cm: Number(v("profile-height")) || null,
      weight_kg: Number(v("profile-weight")) || null,
      goal: v("profile-goal") || null,
      updated_at: new Date().toISOString(),
    };

    var r = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (r.error) throw r.error;
  }

  function isProfileComplete(profile) {
    if (!profile) return false;
    return !!(
      String(profile.full_name || "").trim() &&
      profile.age != null &&
      profile.height_cm != null &&
      profile.weight_kg != null &&
      String(profile.goal || "").trim()
    );
  }

  async function redirectByProfile(userId) {
    try {
      var profile = await loadProfile(userId);
      if (isProfileComplete(profile)) {
        window.location.href = "wellness.html";
      } else {
        window.location.href = "cabinet.html";
      }
    } catch (err) {
      window.location.href = "cabinet.html";
    }
  }

  async function runCabinetPage() {
    var session = await getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }
    var userId = session.user.id;
    var canEdit = new URLSearchParams(window.location.search).get("edit") === "1";

    document.getElementById("cabinet-form")?.addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        setText("cabinet-status", "Сохраняю...", "");
        await saveProfile(userId);
        setText("cabinet-status", "Профиль сохранён. Перехожу к боту и дневнику...", "ok");
        window.setTimeout(function () {
          window.location.href = "wellness.html";
        }, 700);
      } catch (err) {
        setText("cabinet-status", err.message || "Ошибка сохранения профиля", "error");
      }
    });

    document.getElementById("cabinet-logout-btn")?.addEventListener("click", async function () {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });

    try {
      setText("cabinet-status", "Загружаю профиль...", "");
      var profile = await Promise.race([
        loadProfile(userId),
        new Promise(function (_, reject) {
          window.setTimeout(function () {
            reject(new Error("Время ожидания истекло. Обновите страницу."));
          }, 12000);
        }),
      ]);

      if (profile) {
        if (isProfileComplete(profile) && !canEdit) {
          window.location.href = "wellness.html";
          return;
        }
        setV("profile-full-name", profile.full_name);
        setV("profile-age", profile.age);
        setV("profile-height", profile.height_cm);
        setV("profile-weight", profile.weight_kg);
        setV("profile-goal", profile.goal);
      }
      setText("cabinet-status", "Профиль загружен.", "ok");
    } catch (err) {
      setText("cabinet-status", err.message || "Ошибка загрузки профиля", "error");
    }
  }

  if (page === "login") {
    runLoginPage();
  } else if (page === "cabinet") {
    runCabinetPage();
  }
})();
