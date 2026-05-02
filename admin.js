(function () {
  "use strict";

  var cfg = window.NUTRI_CMS || {};
  var statusEl = document.getElementById("admin-status");
  var listEl = document.getElementById("admin-articles-list");
  var formEl = document.getElementById("article-editor-form");
  var articlesSection = document.getElementById("admin-articles-section");
  var editorSection = document.getElementById("admin-editor-section");
  var categoryFiltersEl = document.getElementById("admin-category-filters");
  var loginCard = document.getElementById("admin-login-card");
  var loginNote = document.getElementById("admin-login-note");
  var saveBtn = document.getElementById("article-save-btn");
  var saveStatusEl = document.getElementById("article-save-status");

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    if (statusEl) {
      statusEl.className = "admin-status error";
      statusEl.textContent = "Заполните supabaseUrl и supabaseAnonKey в cms-config.js";
    }
    return;
  }

  var supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  var table = cfg.articlesTable || "articles";
  var bucket = cfg.imagesBucket || "article-images";
  var articlesCache = [];
  var activeCategory = "all";
  var categoryLabels = {
    "nutrition-base": "Питание и база",
    "overeating-appetite": "Переедание и аппетит",
    "nutrition-psychology": "Психология питания",
    "personal-story": "Личный опыт",
    "nutrition-money": "Питание и деньги",
    "food-behavior": "Еда и поведение",
    "childhood-food": "Детство и питание",
  };

  function setStatus(text, type) {
    if (!statusEl) return;
    statusEl.className = "admin-status" + (type ? " " + type : "");
    statusEl.textContent = text;
  }

  function setAuthorizedUI(isAuthorized) {
    if (articlesSection) articlesSection.classList.toggle("admin-hidden", !isAuthorized);
    if (editorSection) editorSection.classList.toggle("admin-hidden", !isAuthorized);
    if (loginCard) loginCard.classList.toggle("admin-hidden", isAuthorized);
    if (loginNote) loginNote.classList.toggle("admin-hidden", isAuthorized);
    document.body.classList.toggle("admin-login-only", !isAuthorized);
    document.body.classList.toggle("admin-authorized", !!isAuthorized);
  }

  function setSaveStatus(text, type) {
    if (!saveStatusEl) return;
    saveStatusEl.className = "article-save-status" + (type ? " " + type : "");
    saveStatusEl.textContent = text || "";
  }

  function setArticlesListVisible(isVisible) {
    if (listEl) listEl.classList.toggle("admin-hidden", !isVisible);
    if (categoryFiltersEl) categoryFiltersEl.classList.toggle("admin-hidden", !isVisible);
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || "";
  }

  function slugifyRu(text) {
    var map = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
      к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
      х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    };
    var normalized = String(text || "")
      .toLowerCase()
      .split("")
      .map(function (ch) {
        return map[ch] !== undefined ? map[ch] : ch;
      })
      .join("");

    return normalized
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }

  function buildUniqueSlug(title, currentId) {
    var base = slugifyRu(title) || "article";
    var slug = base;
    var idx = 2;
    while (
      articlesCache.some(function (item) {
        return item.slug === slug && String(item.id) !== String(currentId || "");
      })
    ) {
      slug = base + "-" + idx;
      idx += 1;
    }
    return slug;
  }

  function collectArticle() {
    var titleRu = getValue("article-title-ru");
    var excerptRu = getValue("article-excerpt-ru");
    var contentRu = getValue("article-content-ru");
    var id = getValue("article-id") || null;
    var existingSlug = getValue("article-slug");
    return {
      id: id,
      slug: existingSlug || buildUniqueSlug(titleRu, id),
      category: getValue("article-category"),
      title_ru: titleRu,
      title_en: titleRu,
      excerpt_ru: excerptRu,
      excerpt_en: excerptRu,
      content_ru: contentRu,
      content_en: contentRu,
      image: getValue("article-image-url"),
      publishedAt: new Date().toISOString(),
    };
  }

  function resetEditor() {
    setValue("article-id", "");
    setValue("article-slug", "");
    setValue("article-title-ru", "");
    setValue("article-excerpt-ru", "");
    setValue("article-content-ru", "");
    setValue("article-image-url", "");
    var imgFile = document.getElementById("article-image-file");
    if (imgFile) imgFile.value = "";
  }

  function fillEditor(article) {
    setValue("article-id", article.id);
    setValue("article-slug", article.slug);
    setValue("article-category", article.category);
    setValue("article-title-ru", article.title_ru);
    setValue("article-excerpt-ru", article.excerpt_ru);
    setValue("article-content-ru", article.content_ru);
    setValue("article-image-url", article.image);
  }

  async function ensureSignedIn() {
    var sessionResult = await supabase.auth.getSession();
    return !!(sessionResult.data && sessionResult.data.session);
  }

  async function loadArticles() {
    var signedIn = await ensureSignedIn();
    if (!signedIn) {
      setAuthorizedUI(false);
      setStatus("Войдите как администратор.", "");
      listEl.innerHTML = "";
      setArticlesListVisible(true);
      return;
    }

    setAuthorizedUI(true);
    setArticlesListVisible(true);
    setStatus("Загружаю статьи...", "");
    var result = await supabase
      .from(table)
      .select("*")
      .order("publishedAt", { ascending: false });

    if (result.error) {
      setStatus(result.error.message, "error");
      return;
    }

    articlesCache = result.data || [];
    if (
      activeCategory !== "all" &&
      !articlesCache.some(function (a) {
        return a.category === activeCategory;
      })
    ) {
      activeCategory = "all";
    }
    renderCategoryFilters();
    renderList();
  }

  function renderList() {
    var filtered = articlesCache.filter(function (a) {
      if (activeCategory === "all") return true;
      return a.category === activeCategory;
    });

    listEl.innerHTML = filtered
      .map(function (a) {
        return (
          '<li class="admin-item">' +
          "<p><strong>" +
          a.title_ru +
          "</strong><br><small>" +
          a.slug +
          " • " +
          a.category +
          "</small></p>" +
          '<button class="btn btn-small btn-ghost" type="button" data-id="' +
          a.id +
          '">Редактировать</button>' +
          "</li>"
        );
      })
      .join("");

    if (!filtered.length) {
      listEl.innerHTML = '<li class="admin-item"><p>В этой категории пока нет статей.</p></li>';
    }

    var label = activeCategory === "all" ? "все категории" : (categoryLabels[activeCategory] || activeCategory);
    setStatus("Показано: " + filtered.length + " (" + label + ").", "ok");
  }

  function renderCategoryFilters() {
    if (!categoryFiltersEl) return;
    var categoriesFromData = [];
    articlesCache.forEach(function (item) {
      var key = String(item.category || "").trim();
      if (!key) return;
      if (categoriesFromData.indexOf(key) === -1) categoriesFromData.push(key);
    });
    var categories = ["all"].concat(
      categoriesFromData.sort(function (a, b) {
        return (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b, "ru");
      })
    );

    categoryFiltersEl.innerHTML = categories
      .map(function (cat) {
        var label = cat === "all" ? "Все категории" : categoryLabels[cat] || cat;
        var activeClass = cat === activeCategory ? " is-active" : "";
        return (
          '<button type="button" class="btn btn-small btn-ghost admin-filter-btn' +
          activeClass +
          '" data-category="' +
          cat +
          '">' +
          label +
          "</button>"
        );
      })
      .join("");

    Array.prototype.forEach.call(
      categoryFiltersEl.querySelectorAll("[data-category]"),
      function (btn) {
        btn.addEventListener("click", function () {
          activeCategory = btn.getAttribute("data-category") || "all";
          renderCategoryFilters();
          renderList();
        });
      }
    );
  }

  async function uploadImageIfNeeded() {
    var input = document.getElementById("article-image-file");
    if (!input || !input.files || !input.files[0]) return getValue("article-image-url");

    var file = input.files[0];
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var fileName = Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
    var path = "articles/" + fileName;

    var up = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) throw up.error;

    var pub = supabase.storage.from(bucket).getPublicUrl(path);
    return (pub.data && pub.data.publicUrl) || "";
  }

  async function onSave(event) {
    event.preventDefault();
    var signedIn = await ensureSignedIn();
    if (!signedIn) {
      setStatus("Сначала войдите.", "error");
      return;
    }

    try {
      setSaveStatus("Загружается…", "");
      if (saveBtn) saveBtn.disabled = true;
      setStatus("Сохраняю...", "");
      var payload = collectArticle();
      var uploadedUrl = await uploadImageIfNeeded();
      if (uploadedUrl) payload.image = uploadedUrl;
      setSaveStatus("Сохраняется…", "");
      var id = payload.id;
      delete payload.id;

      var result;
      if (id) {
        result = await supabase.from(table).update(payload).eq("id", id);
      } else {
        result = await supabase.from(table).insert(payload);
      }
      if (result.error) throw result.error;

      setSaveStatus("Сохранено", "ok");
      setStatus("Сохранено.", "ok");
      await loadArticles();
      if (!id) resetEditor();
      window.setTimeout(function () {
        setSaveStatus("", "");
      }, 1800);
    } catch (err) {
      setSaveStatus("Ошибка сохранения", "error");
      setStatus(err.message || "Ошибка сохранения", "error");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function onDelete() {
    var id = getValue("article-id");
    if (!id) {
      setStatus("Выберите статью для удаления.", "error");
      return;
    }
    if (!window.confirm("Удалить статью?")) return;

    var result = await supabase.from(table).delete().eq("id", id);
    if (result.error) {
      setStatus(result.error.message, "error");
      return;
    }
    setStatus("Удалено.", "ok");
    resetEditor();
    await loadArticles();
  }

  async function onLogin(event) {
    event.preventDefault();
    var email = getValue("admin-email");
    var password = getValue("admin-password");
    var result = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (result.error) {
      setStatus(result.error.message, "error");
      return;
    }
    setAuthorizedUI(true);
    setStatus("Вход выполнен.", "ok");
    await loadArticles();
  }

  async function onLogout() {
    await supabase.auth.signOut();
    setAuthorizedUI(false);
    setStatus("Вы вышли из админки.", "");
    setSaveStatus("", "");
    setArticlesListVisible(true);
    listEl.innerHTML = "";
    resetEditor();
  }

  function onCreateNewArticle() {
    resetEditor();
    setArticlesListVisible(false);
    setStatus("Режим новой статьи: заполните поля и сохраните.", "ok");
    editorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("article-title-ru")?.focus();
  }

  document.getElementById("admin-login-form")?.addEventListener("submit", onLogin);
  document.getElementById("admin-logout-btn")?.addEventListener("click", onLogout);
  formEl?.addEventListener("submit", onSave);
  document.getElementById("delete-article-btn")?.addEventListener("click", onDelete);
  document.getElementById("new-article-btn")?.addEventListener("click", onCreateNewArticle);
  document.getElementById("reload-articles-btn")?.addEventListener("click", loadArticles);

  listEl?.addEventListener("click", function (event) {
    var target = event.target && event.target.nodeType === 1 ? event.target : event.target?.parentElement;
    var btn = target ? target.closest("[data-id]") : null;
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var article = articlesCache.find(function (item) {
      return String(item.id) === String(id);
    });
    if (article) {
      fillEditor(article);
      setArticlesListVisible(true);
    }
  });

  (async function initAuthGate() {
    setAuthorizedUI(false);
    var sessionResult = await supabase.auth.getSession();
    var hasSession = !!(sessionResult.data && sessionResult.data.session);
    if (hasSession) {
      await supabase.auth.signOut();
    }
    setStatus("Войдите как администратор.", "");
  })();
})();
