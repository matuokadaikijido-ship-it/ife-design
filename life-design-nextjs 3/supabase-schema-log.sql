-- Life Design: 部屋の中の「日記型」記録機能
-- Supabase の SQL Editor に貼り付けて実行してください。

alter table room_items
  add column if not exists entry_type text not null default 'item';

-- entry_type: 'item'（今までの箇条書き項目）/ 'log'（日付ごとの一言記録）
