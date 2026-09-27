"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROOMS, COUNTRY_LABEL, COUNTRY_ACCENT } from "@/lib/rooms";
import { fetchRoomItems, fetchTasks, updateTaskFields, deleteTaskById } from "@/lib/data";
import ItemList from "@/components/ItemList";
import TaskList from "@/components/TaskList";
import RoomLog from "@/components/RoomLog";

export default function RoomPageClient({ roomId }) {
  const meta = ROOMS[roomId];
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [i, t] = await Promise.all([fetchRoomItems(roomId), fetchTasks()]);
    setItems(i);
    setTasks(t.filter((x) => x.room_id === roomId));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (!meta) return <p>ページが見つかりません。</p>;

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
    <main className="board" data-screen="room">
      <section className="card page room-page" style={{ "--accent": COUNTRY_ACCENT[meta.country] }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <p className="page__breadcrumb">{COUNTRY_LABEL[meta.country]}</p>
        <div className="page__title-row">
          <h2 className="page__title">{meta.label}</h2>
          <Link href={`/rooms/${roomId}/add`} className="page__edit">
            ＋ 追加
          </Link>
        </div>

        {!loading && <ItemList items={items.filter((i) => i.entry_type !== "log")} />}

        {!loading && (
          <RoomLog roomId={roomId} logs={items.filter((i) => i.entry_type === "log")} onChanged={refresh} />
        )}

        {roomId !== "quick-memo" && (
          <div className="page__tasks">
            <h3 className="page__tasks-heading">このページのタスク</h3>
            {!loading && (
              <TaskList
                tasks={tasks}
                showRoomBadge
                emptyText="このページのタスクはまだありません。"
                onToggleDone={toggleDone}
                onTogglePin={togglePin}
                onRemove={remove}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
