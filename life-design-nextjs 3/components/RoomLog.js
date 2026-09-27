"use client";

import { useState } from "react";
import { createRoomLog, deleteRoomLog } from "@/lib/data";

function formatLogTimestamp(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function RoomLog({ roomId, logs, onChanged }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      await createRoomLog(roomId, value);
      setText("");
      onChanged && onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, entryText) {
    if (!confirm(`「${entryText}」を削除しますか？この操作は取り消せません。`)) return;
    await deleteRoomLog(id);
    onChanged && onChanged();
  }

  const sorted = [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="room-log">
      <h3 className="page__tasks-heading">ログ・日々の記録</h3>
      <form className="quick-inline" onSubmit={handleSubmit}>
        <input
          type="text"
          className="quick-inline__input"
          placeholder="今日の記録をひとこと…"
          maxLength={280}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="quick-inline__send" aria-label="記録を追加">
          →
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="item-list__empty">まだ記録がありません。</p>
      ) : (
        <ul className="room-log__list">
          {sorted.map((log) => (
            <li key={log.id} className="room-log__entry">
              <span className="room-log__timestamp">{formatLogTimestamp(log.created_at)}</span>
              <span className="room-log__text">{log.title}</span>
              <button
                type="button"
                className="tasklist__remove"
                aria-label="削除"
                onClick={() => handleDelete(log.id, log.title)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
