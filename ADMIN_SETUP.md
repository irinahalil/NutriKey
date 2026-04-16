# Настройка админки статей (Supabase)

## 1) Создайте проект Supabase

1. Откройте [Supabase](https://supabase.com/) и создайте проект.
2. В `Project Settings -> API` скопируйте:
   - `Project URL`
   - `anon public key`
3. Вставьте их в `cms-config.js`:
   - `supabaseUrl`
   - `supabaseAnonKey`

## 2) Создайте таблицу статей

В `SQL Editor` выполните:

```sql
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null,
  title_ru text not null,
  title_en text not null,
  excerpt_ru text,
  excerpt_en text,
  content_ru text not null,
  content_en text not null,
  image text,
  "publishedAt" timestamptz default now()
);
```

## 3) Включите RLS и политики

```sql
alter table public.articles enable row level security;

-- читать статьи может кто угодно (публичный сайт)
create policy "Public read articles"
on public.articles for select
to anon, authenticated
using (true);

-- менять статьи может только авторизованный админ
create policy "Authenticated can insert articles"
on public.articles for insert
to authenticated
with check (true);

create policy "Authenticated can update articles"
on public.articles for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete articles"
on public.articles for delete
to authenticated
using (true);
```

## 4) Создайте bucket для изображений

1. `Storage -> Create bucket`
2. Название: `article-images` (как в `cms-config.js`)
3. Поставьте `Public bucket` = ON

## 5) Добавьте админа

1. `Authentication -> Users -> Invite user`
2. Укажите email администратора.
3. Назначьте пароль (или через ссылку подтверждения).
4. Вход в админку: `admin.html`

## 6) Где что работает

- `admin.html` — вход и управление статьями, загрузка изображений с компьютера
- `articles.html` — вкладки категорий и список статей
- `article.html` — отдельная страница статьи

