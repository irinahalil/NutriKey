(function () {
  "use strict";

  var cfg = window.NUTRI_CMS || {};
  var hasSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);

  var CATEGORY_LIST = [
    { id: "nutrition-base", ru: "Питание и база", en: "Nutrition Basics" },
    { id: "overeating-appetite", ru: "Переедание и аппетит", en: "Overeating & Appetite" },
    { id: "nutrition-psychology", ru: "Психология питания", en: "Nutrition Psychology" },
    { id: "personal-story", ru: "Личный опыт", en: "Personal Story" },
    { id: "nutrition-money", ru: "Питание и деньги", en: "Nutrition & Money" },
    { id: "food-behavior", ru: "Еда и поведение", en: "Food & Behavior" },
    { id: "childhood-food", ru: "Детство и питание", en: "Childhood & Food" },
  ];

  var UI = {
    pageTitleArticles: "Статьи | NutriKey",
    pageTitleArticle: "Статья | NutriKey",
    articlesTitle: "Статьи",
    all: "Все",
    readMore: "Читать",
    empty: "В этой категории пока нет статей.",
    backHome: "На главную",
    backToArticles: "К статьям",
    notFound: "Статья не найдена.",
    posted: "Опубликовано",
  };

  function escapeHtml(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function markdownToHtml(md) {
    var lines = String(md || "").replace(/\r/g, "").split("\n");
    var out = [];
    var inList = false;

    function closeList() {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    }

    for (var i = 0; i < lines.length; i += 1) {
      var raw = lines[i];
      var line = raw.trim();
      if (!line) {
        closeList();
        continue;
      }

      if (line.indexOf("### ") === 0) {
        closeList();
        out.push("<h3>" + escapeHtml(line.slice(4)) + "</h3>");
        continue;
      }

      if (line.indexOf("## ") === 0) {
        closeList();
        out.push("<h2>" + escapeHtml(line.slice(3)) + "</h2>");
        continue;
      }

      if (line.indexOf("- ") === 0) {
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push("<li>" + escapeHtml(line.slice(2)) + "</li>");
        continue;
      }

      closeList();
      out.push("<p>" + escapeHtml(line) + "</p>");
    }

    closeList();
    return out.join("");
  }

  function getCategoryName(id) {
    for (var i = 0; i < CATEGORY_LIST.length; i += 1) {
      if (CATEGORY_LIST[i].id === id) return CATEGORY_LIST[i].ru;
    }
    return id || "";
  }

  function normalizeArticle(a) {
    return {
      slug: a.slug || "",
      category: a.category || "",
      title_ru: a.title_ru || "",
      excerpt_ru: a.excerpt_ru || "",
      content_ru: a.content_ru || "",
      image: a.image || "",
      publishedAt: a.publishedAt || "",
    };
  }

  function fallbackArticles() {
    return [
      {
        slug: "calorie-balance",
        category: "nutrition-base",
        title_ru: "Калории: дефицит, профицит и поддержание",
        excerpt_ru: "База для старта без крайностей.",
        content_ru:
          "## Что важно\n- Сначала определите цель\n- Отслеживайте динамику 2-3 недели\n- Корректируйте рацион постепенно",
        image: "",
        publishedAt: "2026-04-16",
      },
    ];
  }

  async function loadArticles() {
    if (!hasSupabase) return fallbackArticles();
    var supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    var table = cfg.articlesTable || "articles";
    var response = await supabase
      .from(table)
      .select("*")
      .order("publishedAt", { ascending: false });
    if (response.error) throw response.error;
    var data = response.data || [];
    if (!Array.isArray(data)) return fallbackArticles();
    return data.map(normalizeArticle);
  }

  function buildArticleUrl(slug) {
    return "article.html?slug=" + encodeURIComponent(slug);
  }

  function applyCommonUI() {
    var home = document.getElementById("back-home-link");
    if (home) home.textContent = UI.backHome;
    var back = document.getElementById("back-articles-link");
    if (back) back.textContent = UI.backToArticles;
    document.documentElement.lang = "ru";
  }

  function initArticlesPage() {
    applyCommonUI();
    document.title = UI.pageTitleArticles;

    var title = document.getElementById("articles-title");
    var tabs = document.getElementById("articles-tabs");
    var list = document.getElementById("articles-list");
    var empty = document.getElementById("articles-empty");
    if (!title || !tabs || !list || !empty) return;
    title.textContent = UI.articlesTitle;
    empty.textContent = UI.empty;

    var params = new URLSearchParams(window.location.search);
    var fromHash = window.location.hash ? window.location.hash.slice(1) : "";
    var activeCategory = params.get("category") || fromHash || "all";
    var articlesCache = [];

    function renderTabs() {
      var tabData = [{ id: "all", label: UI.all }].concat(
        CATEGORY_LIST.map(function (c) {
          return { id: c.id, label: c.ru };
        })
      );
      tabs.innerHTML = tabData
        .map(function (tab) {
          var active = tab.id === activeCategory ? " is-active" : "";
          return (
            '<button class="articles-tab' +
            active +
            '" type="button" data-category="' +
            tab.id +
            '">' +
            escapeHtml(tab.label) +
            "</button>"
          );
        })
        .join("");
    }

    function renderList() {
      var filtered =
        activeCategory === "all"
          ? articlesCache
          : articlesCache.filter(function (a) {
              return a.category === activeCategory;
            });

      list.innerHTML = filtered
        .map(function (a) {
          var cardTitle = a.title_ru;
          var excerpt = a.excerpt_ru;
          var categoryName = getCategoryName(a.category);
          var image = a.image
            ? '<img src="' + escapeHtml(a.image) + '" alt="' + escapeHtml(cardTitle) + '" />'
            : "";
          return (
            '<article class="article-card">' +
            image +
            '<div class="article-card-body">' +
            '<h2 class="article-card-title">' +
            escapeHtml(cardTitle) +
            "</h2>" +
            '<p class="article-card-meta">' +
            escapeHtml(categoryName) +
            "</p>" +
            "<p>" +
            escapeHtml(excerpt) +
            "</p>" +
            '<p style="margin-top:10px;"><a class="btn btn-small" href="' +
            buildArticleUrl(a.slug) +
            '">' +
            escapeHtml(UI.readMore) +
            "</a></p>" +
            "</div></article>"
          );
        })
        .join("");

      empty.hidden = filtered.length !== 0;
    }

    tabs.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-category]");
      if (!btn) return;
      activeCategory = btn.getAttribute("data-category") || "all";
      window.location.hash = activeCategory === "all" ? "" : activeCategory;
      renderTabs();
      renderList();
    });

    loadArticles()
      .then(function (listData) {
        articlesCache = listData;
        renderTabs();
        renderList();
      })
      .catch(function () {
        articlesCache = fallbackArticles();
        renderTabs();
        renderList();
      });
  }

  function initArticlePage() {
    applyCommonUI();
    document.title = UI.pageTitleArticle;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("slug") || "";

    var titleEl = document.getElementById("article-title");
    var metaEl = document.getElementById("article-meta");
    var coverEl = document.getElementById("article-cover");
    var contentEl = document.getElementById("article-content");
    if (!titleEl || !metaEl || !coverEl || !contentEl) return;

    loadArticles()
      .then(function (items) {
        var a = items.find(function (item) {
          return item.slug === slug;
        });
        if (!a) {
          titleEl.textContent = UI.notFound;
          metaEl.textContent = "";
          contentEl.innerHTML = "<p>" + escapeHtml(UI.notFound) + "</p>";
          return;
        }

        var title = a.title_ru;
        var content = a.content_ru;
        var catName = getCategoryName(a.category);
        var date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("ru-RU") : "";

        titleEl.textContent = title;
        document.title = title + " | NutriKey";
        metaEl.textContent =
          catName + (date ? " • " + UI.posted + ": " + date : "");
        contentEl.innerHTML = markdownToHtml(content);

        if (a.image) {
          coverEl.src = a.image;
          coverEl.alt = title;
          coverEl.hidden = false;
        }
      })
      .catch(function () {
        titleEl.textContent = UI.notFound;
        contentEl.innerHTML = "<p>" + escapeHtml(UI.notFound) + "</p>";
      });
  }

  var page = document.body.getAttribute("data-page");
  if (page === "articles") initArticlesPage();
  if (page === "article") initArticlePage();
})();
