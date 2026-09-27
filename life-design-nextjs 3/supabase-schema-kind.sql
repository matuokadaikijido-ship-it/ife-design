-- Life Design: 予定／タスクの仕分け用スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください。

alter table tasks
  add column if not exists kind text not null default 'task';

-- kind: 'event'（予定・Googleカレンダーに同期される）/ 'task'（タスク・同期されない）
