-- Life Design: Supabase スキーマ
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください。

-- 1. タスク管理表（共通の母艦）
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  room_id text,                -- 例: 'saudi-coaching' / null なら未分類
  related_item_id uuid,        -- room_items.id を参照（任意）
  due_date date not null,
  due_time time,                -- 任意
  url text,                     -- 任意
  done boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. 各部屋・クイックメモの項目（題名・備考・リンク・添付）
create table if not exists room_items (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,       -- 例: 'saudi-coaching' / 'quick-memo'
  title text not null,
  notes text,
  url text,
  attachment_path text,        -- Storage バケット内のパス（後述）
  attachment_name text,
  attachment_type text,
  created_at timestamptz not null default now()
);

-- 3. 表示地域・並び替えなど、ちょっとした個人設定
create table if not exists app_settings (
  key text primary key,
  value text
);

-- Row Level Security：まずは「anon キーを知っていれば読み書きできる」
-- 個人利用の簡易版として全開放します。複数人で使う場合は later に見直しましょう。
alter table tasks enable row level security;
alter table room_items enable row level security;
alter table app_settings enable row level security;

create policy "allow all - tasks" on tasks for all using (true) with check (true);
create policy "allow all - room_items" on room_items for all using (true) with check (true);
create policy "allow all - app_settings" on app_settings for all using (true) with check (true);

-- 4. 添付ファイル用の Storage バケット（画像・書類）
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "allow all - attachments read" on storage.objects
  for select using (bucket_id = 'attachments');
create policy "allow all - attachments write" on storage.objects
  for insert with check (bucket_id = 'attachments');
create policy "allow all - attachments delete" on storage.objects
  for delete using (bucket_id = 'attachments');
