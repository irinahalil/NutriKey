export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    try {
      const rateLimit = await checkRateLimit(request, env);
      if (!rateLimit.ok) {
        return json(
          {
            ok: false,
            error: "Too many requests. Please try again later.",
            retry_after_seconds: rateLimit.retryAfter,
          },
          429
        );
      }

      const { name, email, phone, source } = await request.json();
      if (!name || !email || !phone) {
        return json({ ok: false, error: "Missing fields" }, 400);
      }

      const submittedAt = formatDateTime(new Date());
      const text = [
        "📩 Новая заявка NutriKey",
        "",
        `🏷 Источник: ${source || "NutriKey"}`,
        `👤 Имя: ${name}`,
        `📧 Email: ${email}`,
        `📱 Телефон: ${phone}`,
        `🕒 Дата: ${submittedAt}`,
      ].join("\n");

      const tgRes = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: text,
          }),
        }
      );

      if (!tgRes.ok) {
        const body = await tgRes.text();
        return json({ ok: false, error: "Telegram API error", details: body }, 502);
      }

      return json({ ok: true }, 200);
    } catch (err) {
      return json({ ok: false, error: err.message || "Unexpected error" }, 500);
    }
  },
};

const RATE_LIMIT_WINDOW_SECONDS = 60;

async function checkRateLimit(request, env) {
  // Если KV не подключен, не блокируем отправку.
  if (!env.RATE_LIMIT_KV) return { ok: true };

  const ip = getClientIp(request);
  if (!ip) return { ok: true };

  const key = `rl:${ip}`;
  const existing = await env.RATE_LIMIT_KV.get(key);
  if (existing) {
    const ts = Number(existing);
    if (Number.isFinite(ts)) {
      const now = Math.floor(Date.now() / 1000);
      const diff = now - ts;
      if (diff < RATE_LIMIT_WINDOW_SECONDS) {
        return { ok: false, retryAfter: RATE_LIMIT_WINDOW_SECONDS - diff };
      }
    }
  }

  const now = Math.floor(Date.now() / 1000);
  await env.RATE_LIMIT_KV.put(key, String(now), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return { ok: true };
}

function getClientIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const xff = request.headers.get("X-Forwarded-For");
  if (!xff) return "";
  return xff.split(",")[0].trim();
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Europe/Moscow",
  }).format(date);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}
