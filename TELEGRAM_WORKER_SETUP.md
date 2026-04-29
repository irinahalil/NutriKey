# Telegram через Cloudflare Worker (без Supabase)

Этот вариант хранит токен бота на стороне Worker (безопасно для фронтенда).

## 1) Подготовка

У вас уже есть:
- Telegram bot token
- `chat_id` (личный чат)

## 2) Деплой Worker

1. Установите Wrangler (если не установлен):
   - `npm i -g wrangler`
2. Авторизуйтесь:
   - `wrangler login`
3. Откройте терминал в папке `cloudflare-worker`:
   - `cd cloudflare-worker`
4. Задайте секреты:
   - `wrangler secret put TELEGRAM_BOT_TOKEN`
   - `wrangler secret put TELEGRAM_CHAT_ID`
5. Создайте KV namespace для rate-limit:
   - `wrangler kv namespace create RATE_LIMIT_KV`
   - скопируйте `id` из ответа команды
   - вставьте `id` в `cloudflare-worker/wrangler.toml` вместо `PUT_YOUR_KV_NAMESPACE_ID_HERE`
6. Задеплойте:
   - `wrangler deploy`

После деплоя будет URL вида:
`https://nutrikey-leads.<your-subdomain>.workers.dev`

## 3) Подключение на сайте

В `script.js` найдите:

```js
const CONTACT_API_ENDPOINT = "";
```

Вставьте URL Worker:

```js
const CONTACT_API_ENDPOINT = "https://nutrikey-leads.<your-subdomain>.workers.dev";
```

## 4) Проверка

1. Откройте сайт.
2. Отправьте форму "Написать мне".
3. Заявка должна прийти в Telegram.

Если Worker недоступен, сайт откроет fallback-сценарий (открытие Telegram-ссылки).

## 5) Как работает антиспам

- Один IP может отправлять не чаще, чем 1 заявка в 25 секунд.
- При превышении лимита Worker вернет `429 Too Many Requests`.
