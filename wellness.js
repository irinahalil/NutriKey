(function () {
  "use strict";

  var cfg = window.NUTRI_CMS || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;

  var supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  var diaryTable = cfg.diaryTable || "food_diary_entries";
  var diaryBucket = cfg.diaryBucket || "food-diary";
  var chatTable = cfg.chatTable || "cabinet_chat_messages";

  function setStatus(id, text, kind) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = "status" + (kind ? " " + kind : "");
    el.textContent = text || "";
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function isSchemaCacheError(err) {
    var msg = String((err && err.message) || "").toLowerCase();
    return msg.includes("could not find the table") && msg.includes("schema cache");
  }

  async function withRetry(task, retries, delayMs) {
    var attempts = Math.max(1, retries || 1);
    var waitMs = delayMs || 1200;
    var lastErr = null;
    for (var i = 0; i < attempts; i += 1) {
      try {
        return await task();
      } catch (err) {
        lastErr = err;
        if (!isSchemaCacheError(err) || i === attempts - 1) throw err;
        await sleep(waitMs);
      }
    }
    throw lastErr;
  }

  function botReply(text) {
    var t = String(text || "").toLowerCase();
    if (t.includes("бжу") || t.includes("кбжу")) {
      return "Для расчета БЖУ возьмем цель, вес, рост и активность. В ближайшем обновлении добавлю персональный расчет прямо в чате.";
    }
    if (t.includes("переед")) {
      return "После переедания не наказывайте себя. Вернитесь к обычному режиму питания и воде, без жестких ограничений.";
    }
    if (t.includes("сладк")) {
      return "Тяга к сладкому часто усиливается при недосыпе и больших перерывах в еде. Попробуйте добавить белок в каждый прием пищи.";
    }
    return "Я сохранил ваш вопрос. Сейчас даю базовую рекомендацию: держите стабильный режим, белок в каждом приеме пищи и умеренный дефицит без крайностей.";
  }

  async function getSession() {
    var r = await supabase.auth.getSession();
    return (r.data && r.data.session) || null;
  }

  async function loadChat(userId) {
    var r = await withRetry(async function () {
      return await supabase
        .from(chatTable)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
    }, 4, 1300);
    if (r.error) throw r.error;
    return r.data || [];
  }

  function renderChat(items) {
    var box = document.getElementById("chat-log");
    if (!box) return;
    box.innerHTML = items
      .map(function (m) {
        var who = m.role === "assistant" ? "assistant" : "user";
        return '<div class="msg ' + who + '">' + esc(m.content) + "</div>";
      })
      .join("");
    box.scrollTop = box.scrollHeight;
  }

  async function sendChat(userId) {
    var input = document.getElementById("chat-input");
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    setStatus("chat-status", "Отправляю...", "");
    var r1 = await withRetry(async function () {
      return await supabase.from(chatTable).insert({
        user_id: userId,
        role: "user",
        content: text,
      });
    }, 4, 1300);
    if (r1.error) {
      setStatus("chat-status", r1.error.message, "error");
      return;
    }

    var answer = botReply(text);
    var r2 = await withRetry(async function () {
      return await supabase.from(chatTable).insert({
        user_id: userId,
        role: "assistant",
        content: answer,
      });
    }, 4, 1300);
    if (r2.error) {
      setStatus("chat-status", r2.error.message, "error");
      return;
    }

    input.value = "";
    var items = await loadChat(userId);
    renderChat(items);
    setStatus("chat-status", "Сообщение отправлено.", "ok");
  }

  async function loadDiary(userId) {
    var r = await withRetry(async function () {
      return await supabase
        .from(diaryTable)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    }, 4, 1300);
    if (r.error) throw r.error;
    return r.data || [];
  }

  function renderDiary(items) {
    var feed = document.getElementById("diary-feed");
    if (!feed) return;
    feed.innerHTML = items
      .map(function (d) {
        var dt = d.created_at ? new Date(d.created_at).toLocaleString("ru-RU") : "";
        var img = d.image_url ? '<img src="' + esc(d.image_url) + '" alt="Фото еды" />' : "";
        return (
          '<article class="diary-item">' +
          '<div class="diary-meta">' +
          esc(dt) +
          "</div>" +
          "<p>" +
          esc(d.note || "") +
          "</p>" +
          img +
          "</article>"
        );
      })
      .join("");
  }

  async function saveDiary(userId) {
    var noteEl = document.getElementById("diary-note");
    var fileEl = document.getElementById("diary-photo");
    if (!noteEl || !fileEl) return;

    var note = noteEl.value.trim();
    var file = fileEl.files && fileEl.files[0] ? fileEl.files[0] : null;
    if (!note && !file) {
      setStatus("diary-status", "Добавьте описание или фото.", "error");
      return;
    }

    setStatus("diary-status", "Сохраняю запись...", "");
    var imageUrl = "";

    if (file) {
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      var name = userId + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
      var up = await supabase.storage.from(diaryBucket).upload(name, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (up.error) {
        setStatus("diary-status", up.error.message, "error");
        return;
      }
      var pub = supabase.storage.from(diaryBucket).getPublicUrl(name);
      imageUrl = (pub.data && pub.data.publicUrl) || "";
    }

    var ins = await withRetry(async function () {
      return await supabase.from(diaryTable).insert({
        user_id: userId,
        note: note || null,
        image_url: imageUrl || null,
      });
    }, 4, 1300);
    if (ins.error) {
      setStatus("diary-status", ins.error.message, "error");
      return;
    }

    noteEl.value = "";
    fileEl.value = "";
    var items = await loadDiary(userId);
    renderDiary(items);
    setStatus("diary-status", "Запись добавлена в дневник.", "ok");
  }

  async function init() {
    var session = await getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }
    var userId = session.user.id;

    document.getElementById("wellness-logout-btn")?.addEventListener("click", async function () {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
    document.getElementById("send-chat-btn")?.addEventListener("click", async function () {
      await sendChat(userId);
    });
    document.getElementById("save-diary-btn")?.addEventListener("click", async function () {
      await saveDiary(userId);
    });

    try {
      var chat = await loadChat(userId);
      if (!chat.length) {
        await withRetry(async function () {
          return await supabase.from(chatTable).insert({
            user_id: userId,
            role: "assistant",
            content: "Привет! Я ваш помощник по питанию. Спросите меня про БЖУ, режим или аппетит.",
          });
        }, 4, 1300);
        chat = await loadChat(userId);
      }
      renderChat(chat);
    } catch (e) {
      setStatus("chat-status", e.message || "Ошибка загрузки чата", "error");
    }

    try {
      var diary = await loadDiary(userId);
      renderDiary(diary);
    } catch (e2) {
      setStatus("diary-status", e2.message || "Ошибка загрузки дневника", "error");
    }
  }

  init();
})();
