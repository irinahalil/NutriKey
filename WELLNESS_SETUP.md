# Настройка бота и дневника питания (Supabase)

Выполните SQL целиком в `SQL Editor -> New query -> Run`.

```sql
-- 1) Таблица чата
create table if not exists public.cabinet_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.cabinet_chat_messages enable row level security;

drop policy if exists "Users read own chat" on public.cabinet_chat_messages;
create policy "Users read own chat"
on public.cabinet_chat_messages
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own chat" on public.cabinet_chat_messages;
create policy "Users insert own chat"
on public.cabinet_chat_messages
for insert
to authenticated
with check (auth.uid() = user_id);

-- 2) Таблица дневника
create table if not exists public.food_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.food_diary_entries enable row level security;

drop policy if exists "Users read own diary" on public.food_diary_entries;
create policy "Users read own diary"
on public.food_diary_entries
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own diary" on public.food_diary_entries;
create policy "Users insert own diary"
on public.food_diary_entries
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own diary" on public.food_diary_entries;
create policy "Users delete own diary"
on public.food_diary_entries
for delete
to authenticated
using (auth.uid() = user_id);
```

## Storage для фото дневника

1. `Storage -> Create bucket`
2. Название: `food-diary`
3. Public bucket: `ON`

Далее выполните SQL для прав storage:

```sql
grant usage on schema storage to authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

drop policy if exists "Public read food diary" on storage.objects;
create policy "Public read food diary"
on storage.objects
for select
to public
using (bucket_id = 'food-diary');

drop policy if exists "Users upload food diary" on storage.objects;
create policy "Users upload food diary"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'food-diary');
```

