"use client";

import Link from "next/link";
import { ROOMS } from "@/lib/rooms";

function formatDue(dueDate, dueTime) {
  const d = new Date(dueDate + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  let s = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(d);
  if (dueTime) s += " " + dueTime.slice(0, 5);
  return s;
}

function dueStatus(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return null;
}

export function formatTimestamp(iso) {
  if (!iso) return "";
  return (
    new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso)) + " 追加"
  );
}

// task: { id, text, room_id, related_item_id, due_date, due_time, url, done, pinned, created_at }
export default function TaskList({
  tasks,
  emptyText = "まだタスクはありません。",
  showRoomBadge = false,
  showTimestamp = false,
  itemsById = {},
  onToggleDone,
  onTogglePin,
  onRemove,
  clickable = true,
}) {
  if (!tasks.length) {
    return <p className="tasklist__empty">{emptyText}</p>;
  }

  return (
    <ul className="tasklist">
      {tasks.map((task) => {
        const status = task.done ? null : dueStatus(task.due_date);
        const roomMeta = task.room_id ? ROOMS[task.room_id] : null;
        const relatedItem = task.related_item_id ? itemsById[task.related_item_id] : null;

        return (
          <li
            key={task.id}
            className={`tasklist__item${task.done ? " is-done" : ""}${status ? " is-urgent" : ""}`}
            onClick={(e) => {
              if (!clickable) return;
              if (e.target.closest("button, a")) return;
              window.location.assign(`/tasks/view?id=${task.id}`);
            }}
          >
            <button
              type="button"
              className="tasklist__check"
              aria-pressed={!!task.done}
              aria-label={task.done ? "未完了に戻す" : "完了にする"}
              onClick={() => onToggleDone && onToggleDone(task)}
            />

            <span className="tasklist__body">
              {(showRoomBadge || task.related_item_id || task.url) && (
                <span className="tasklist__meta">
                  {showRoomBadge && (
                    <span className={`tasklist__room${roomMeta ? " tasklist__room--" + roomMeta.country : ""}`}>
                      {roomMeta ? roomMeta.label : "未分類"}
                    </span>
                  )}
                  {relatedItem && (
                    <Link
                      href={`/items?id=${relatedItem.id}`}
                      className="tasklist__related"
                      onClick={(e) => e.stopPropagation()}
                    >
                      → {relatedItem.title}
                    </Link>
                  )}
                  {task.url && (
                    <a
                      className="tasklist__link"
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg aria-hidden="true">
                        <use href="#i-link" />
                      </svg>
                    </a>
                  )}
                </span>
              )}
              <span className="tasklist__text">{task.text}</span>
              {showTimestamp && task.created_at && (
                <span className="item-list__timestamp">{formatTimestamp(task.created_at)}</span>
              )}
            </span>

            {task.due_date && (
              <span className={`tasklist__due-slot${status ? " is-" + status : ""}`}>
                {status === "overdue"
                  ? "期限切れ・" + formatDue(task.due_date, task.due_time)
                  : status === "today"
                  ? "本日" + (task.due_time ? " " + task.due_time.slice(0, 5) : "")
                  : formatDue(task.due_date, task.due_time)}
              </span>
            )}

            <span className="tasklist__actions">
              <Link
                href={`/tasks/add?edit=${task.id}`}
                className="tasklist__editbtn"
                aria-label={`「${task.text}」を編集`}
                onClick={(e) => e.stopPropagation()}
              >
                ✎
              </Link>
              {onTogglePin && (
                <button
                  type="button"
                  className={`tasklist__pin${task.pinned ? " is-pinned" : ""}`}
                  aria-label={task.pinned ? "ピン留めを外す" : "ピン留めする"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(task);
                  }}
                >
                  <svg aria-hidden="true">
                    <use href="#i-pin" />
                  </svg>
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  className="tasklist__remove"
                  aria-label={`「${task.text}」を削除`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(task);
                  }}
                >
                  ×
                </button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
