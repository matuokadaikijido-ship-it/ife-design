"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTasks, updateTaskFields, deleteTaskById, fetchAllItems } from "@/lib/data";
import { ROOMS } from "@/lib/rooms";
import TaskList from "@/components/TaskList";
import ItemList from "@/components/ItemList";

function sortByDueThenCreated(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.due_date && b.due_date) {
      if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
      const at = a.due_time || "99:99", bt = b.due_time || "99:99";
      if (at !== bt) return at < bt ? -1 : 1;
      return new Date(a.created_at) - new Date(b.created_at);
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });
}

function bucketTasks(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msDay = 86400000;
  const buckets = { now: [], week: [], month: [], someday: [] };
  tasks.forEach((t) => {
    if (!t.due_date) {
      buckets.someday.push(t);
      return;
    }
    const due = new Date(t.due_date + "T00:00:00");
    const diffDays = Math.round((due.getTime() - today.getTime()) / msDay);
    if (diffDays <= 1) buckets.now.push(t);
    else if (diffDays <= 7) buckets.week.push(t);
    else if (diffDays <= 30) buckets.month.push(t);
    else buckets.someday.push(t);
  });
  Object.keys(buckets).forEach((k) => (buckets[k] = sortByDueThenCreated(buckets[k])));
  return buckets;
}

const GROUP_LABELS = { now: "今すぐ", week: "1週間以内", month: "1ヶ月以内", someday: "いつか" };

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [t, i] = await Promise.all([fetchTasks(), fetchAllItems()]);
    setTasks(t);
    setItems(i);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const itemsById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks;
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => t.text.toLowerCase().includes(q));
  }, [tasks, query]);

  const buckets = useMemo(() => bucketTasks(filteredTasks), [filteredTasks]);

  const itemResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, query]);

  async function toggleDone(task) {
    await updateTaskFields(task.id, { done: !task.done });
    refresh();
  }
  async function togglePin(task) {
    await updateTaskFields(task.id, { pinned: !task.pinned });
    refresh();
  }
  async function remove(task) {
    if (!confirm(`「${task.text}」を削除しますか？この操作は取り消せません。`)) return;
    await deleteTaskById(task.id);
    refresh();
  }

  return (
    <main className="board" data-screen="tasks">
      <section className="card page tasks-page" style={{ "--accent": "var(--orange)" }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <h2 className="page__title">全タスク</h2>

        <input
          type="search"
          className="tasks-search"
          placeholder="タスク・項目をキーワードで検索…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {!loading &&
          ["now", "week", "month", "someday"].map(
            (key) =>
              buckets[key].length > 0 && (
                <div className="task-group" key={key}>
                  <h3 className="task-group__heading">{GROUP_LABELS[key]}</h3>
                  <TaskList
                    tasks={buckets[key]}
                    showRoomBadge
                    showTimestamp
                    itemsById={itemsById}
                    emptyText="該当するタスクはありません。"
                    onToggleDone={toggleDone}
                    onTogglePin={togglePin}
                    onRemove={remove}
                  />
                </div>
              )
          )}

        {query.trim() && (
          <div className="task-group">
            <h3 className="task-group__heading">項目の検索結果</h3>
            <ItemList items={itemResults} emptyText="一致する項目はありません。" />
          </div>
        )}
      </section>
    </main>
  );
}
