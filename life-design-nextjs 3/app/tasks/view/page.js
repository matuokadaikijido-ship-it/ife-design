"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROOMS } from "@/lib/rooms";
import { fetchTasks, updateTaskFields, fetchItemById } from "@/lib/data";
import { formatTimestamp } from "@/components/TaskList";

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

export default function TaskDetailPage() {
  return (
    <Suspense fallback={null}>
      <TaskDetailInner />
    </Suspense>
  );
}

function TaskDetailInner() {
  const taskId = useSearchParams().get("id");
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [relatedItem, setRelatedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!taskId) return;
    const tasks = await fetchTasks();
    const found = tasks.find((t) => t.id === taskId) || null;
    setTask(found);
    if (found && found.related_item_id) {
      setRelatedItem(await fetchItemById(found.related_item_id));
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (loading) return null;
  if (!task) return <p>タスクが見つかりませんでした。</p>;

  const status = task.done ? null : dueStatus(task.due_date);
  const roomMeta = task.room_id ? ROOMS[task.room_id] : null;

  async function toggleDone() {
    await updateTaskFields(task.id, { done: !task.done });
    refresh();
  }

  return (
    <main className="board" data-screen="task-detail">
      <section className="card page task-detail-page" style={{ "--accent": "var(--orange)" }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <div className="page__title-row">
          <h2 className="page__title">{task.text}</h2>
          <Link href={`/tasks/add?edit=${task.id}`} className="page__edit">
            編集
          </Link>
        </div>

        <div className="detail__meta-row">
          {task.due_date && (
            <span className={`detail__due-badge${status ? " is-" + status : ""}`}>
              {status === "overdue" ? "期限切れ・" : status === "today" ? "本日 " : "期限 "}
              {formatDue(task.due_date, task.due_time)}
            </span>
          )}
          <span className={`tasklist__room${roomMeta ? " tasklist__room--" + roomMeta.country : ""}`}>
            {roomMeta ? roomMeta.label : "未分類"}
          </span>
          {relatedItem && (
            <Link href={`/items?id=${relatedItem.id}`} className="tasklist__related">
              → {relatedItem.title}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="detail__chip detail__chip--toggle"
          aria-pressed={!!task.done}
          onClick={toggleDone}
        >
          <span className="detail__chip-check" aria-hidden="true" />
          {task.done ? "完了ずみ（戻す）" : "完了にする"}
        </button>

        {task.url && (
          <a className="detail__chip" href={task.url} target="_blank" rel="noopener noreferrer">
            <svg aria-hidden="true">
              <use href="#i-link" />
            </svg>
            リンクを開く
          </a>
        )}

        <p className="item-list__timestamp">{formatTimestamp(task.created_at)}</p>
      </section>
    </main>
  );
}
