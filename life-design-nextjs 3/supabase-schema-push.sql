-- Life Design: リマインダー通知用のスキーマ
-- Supabase の SQL Editor に貼り付けて実行してください。

-- 通知を受け取るための「購読情報」を保存するテーブル
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "allow all - push_subscriptions" on push_subscriptions for all using (true) with check (true);

-- 同じタスクに何度も通知を送らないよう、最後に通知した日時を覚えておく
alter table tasks
  add column if not exists reminded_at timestamptz;
