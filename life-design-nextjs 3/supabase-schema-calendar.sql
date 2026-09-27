-- Life Design: Googleカレンダー連携用の追加スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください（supabase-schema.sql の後に実行）。

alter table tasks
  add column if not exists google_event_id text;
