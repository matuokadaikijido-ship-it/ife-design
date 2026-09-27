"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRegion } from "@/components/RegionProvider";
import { ROOMS, COUNTRY_LABEL, roomsByCountry } from "@/lib/rooms";
import { fetchTasks, updateTaskFields, deleteTaskById, fetchAllItems } from "@/lib/data";
import TaskList from "@/components/TaskList";
import ItemList from "@/components/ItemList";
import GoogleEventsCard from "@/components/GoogleEventsCard";

const LIST_LIMIT = 5;

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

export default function HomePage() {
  const { region } = useRegion();
  const [tasks, setTasks] = useState([]);
  const [items, setItems] = useState([]);
  const [pinSort, setPinSort] = useState("due");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [t, i] = await Promise.all([fetchTasks(), fetchAllItems()]);
    setTasks(t);
    setItems(i);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    try {
      const saved = localStorage.getItem("life-design-pin-sort");
      if (saved) setPinSort(saved);
    } catch (e) {}
  }, []);

  const itemsById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const quickMemoItems = useMemo(() => items.filter((i) => i.room_id === "quick-memo").slice(0, LIST_LIMIT), [items]);

  const pinnedSorted = useMemo(() => {
    const pinned = tasks.filter((t) => t.pinned);
    return pinSort === "due" ? sortByDueThenCreated(pinned) : [...pinned].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [tasks, pinSort]);

  const areaTasks = (country) =>
    sortByDueThenCreated(tasks.filter((t) => t.room_id && ROOMS[t.room_id]?.country === country)).slice(0, LIST_LIMIT);

  const previewTasks = useMemo(() => sortByDueThenCreated(tasks.filter((t) => !t.done)).slice(0, 2), [tasks]);

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

  function onPinSortChange(e) {
    setPinSort(e.target.value);
    try {
      localStorage.setItem("life-design-pin-sort", e.target.value);
    } catch (err) {}
  }

  const rooms = roomsByCountry(region);
  const areaTaskList = areaTasks(region);

  return (
    <main className="board" data-view={region} data-screen="country">
      {/* Today's Action */}
      <section className="card card--action" style={{ "--reveal": 1 }}>
        <div className="card__head">
          <span className="badge badge--icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <use href="#i-bolt" />
            </svg>
          </span>
          <h2>Today&apos;s Action &amp; Tasks</h2>
        </div>

        <Link href="/tasks" className="tile tile--preview">
          <span className="tile__preview">
            <span className="tile__label">本日の最優先タスク</span>
            <span className="tile__preview-lines">
              {previewTasks.map((t) => (
                <span key={t.id} className="tile__preview-line">
                  {t.text}
                </span>
              ))}
            </span>
          </span>
          <span className="tile__end">
            <svg className="chev" aria-hidden="true">
              <use href="#i-chevron" />
            </svg>
          </span>
        </Link>

        <div className="quickpin__heading">
          <span>
            クイックメモ<span className="quickpin__heading-sub">思いついたことをサクッと</span>
          </span>
        </div>
        <QuickMemoInline onAdded={refresh} />

        <div className="quickpin__heading">
          <span>
            ピン留め<span className="quickpin__heading-sub">各ページから集まってきた大事なこと</span>
          </span>
          <label className="pin-sort">
            並び替え
            <select value={pinSort} onChange={onPinSortChange}>
              <option value="due">期限が近い順</option>
              <option value="created">追加した順</option>
            </select>
          </label>
        </div>
        {!loading && (
          <TaskList
            tasks={pinnedSorted.slice(0, LIST_LIMIT)}
            showRoomBadge
            itemsById={itemsById}
            emptyText="まだピン留めはありません。各ページのタスクの★を押すと、ここに集まります。"
            onToggleDone={toggleDone}
            onTogglePin={togglePin}
            onRemove={remove}
          />
        )}
        {pinnedSorted.length > LIST_LIMIT && (
          <Link href="/tasks" className="page-link">
            全タスクを見る →
          </Link>
        )}
      </section>

      {/* 国のカード */}
      <section className={`card card--${region}`} style={{ "--reveal": 2 }}>
        <div className="card__head">
          <span className="badge" aria-hidden="true">
            {region === "saudi" ? "SA" : "JP"}
          </span>
          <h2>{COUNTRY_LABEL[region]}</h2>
        </div>
        <ul className="tiles">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link href={`/rooms/${room.id}`} className="tile">
                <span className="tile__label">{room.label}</span>
                <span className="tile__end">
                  <svg className="chev" aria-hidden="true">
                    <use href="#i-chevron" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="area-tasks">
          <h3 className="area-tasks__heading">{COUNTRY_LABEL[region]}のタスク</h3>
          {!loading && (
            <TaskList
              tasks={areaTaskList}
              showRoomBadge
              itemsById={itemsById}
              emptyText="このエリアのタスクはまだありません。"
              onToggleDone={toggleDone}
              onTogglePin={togglePin}
              onRemove={remove}
            />
          )}
          {tasks.filter((t) => t.room_id && ROOMS[t.room_id]?.country === region).length > LIST_LIMIT && (
            <Link href="/tasks" className="page-link">
              全タスクを見る →
            </Link>
          )}
        </div>
      </section>

      {/* クイックメモ */}
      <section className="card card--quickmemo" style={{ "--reveal": 2, "--accent": "var(--orange)" }}>
        <div className="card__head">
          <span className="badge badge--icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <use href="#i-idea" />
            </svg>
          </span>
          <h2>クイックメモ</h2>
        </div>
        {!loading && <ItemList items={quickMemoItems} />}
        <div className="card__actions-row card__actions-row--end">
          <Link href="/rooms/quick-memo" className="page-link">
            全て見る →
          </Link>
        </div>
      </section>

      <GoogleEventsCard />
    </main>
  );
}

function QuickMemoInline({ onAdded }) {
  const [text, setText] = useState("");

  async function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const { createRoomItem } = await import("@/lib/data");
    await createRoomItem("quick-memo", { title: value });
    setText("");
    onAdded && onAdded();
    window.location.assign("/rooms/quick-memo");
  }

  return (
    <form className="quick-inline" onSubmit={submit}>
      <input
        type="text"
        className="quick-inline__input"
        placeholder="メモを入力…"
        maxLength={200}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="quick-inline__send" aria-label="クイックメモに追加して開く">
        →
      </button>
    </form>
  );
}
