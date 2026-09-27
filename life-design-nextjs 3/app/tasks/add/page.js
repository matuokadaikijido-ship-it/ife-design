"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROOMS, roomsByCountry } from "@/lib/rooms";
import { createTask, updateTaskFields, fetchTasks, fetchRoomItems } from "@/lib/data";

export default function TaskAddPage() {
  return (
    <Suspense fallback={null}>
      <TaskAddForm />
    </Suspense>
  );
}

function TaskAddForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [text, setText] = useState("");
  const [roomId, setRoomId] = useState("");
  const [relatedItemId, setRelatedItemId] = useState("");
  const [roomItems, setRoomItems] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [url, setUrl] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!editId) return;
    fetchTasks().then((tasks) => {
      const task = tasks.find((t) => t.id === editId);
      if (!task) return;
      setText(task.text);
      setRoomId(task.room_id || "");
      setRelatedItemId(task.related_item_id || "");
      setDueDate(task.due_date || "");
      setDueTime(task.due_time ? task.due_time.slice(0, 5) : "");
      setUrl(task.url || "");
    });
  }, [editId]);

  useEffect(() => {
    if (!roomId) {
      setRoomItems([]);
      return;
    }
    fetchRoomItems(roomId).then(setRoomItems);
  }, [roomId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !dueDate) return;
    const fields = {
      text: text.trim(),
      roomId: roomId || null,
      relatedItemId: relatedItemId || null,
      dueDate,
      dueTime: dueTime || null,
      url: url.trim(),
    };

    if (editId) {
      await updateTaskFields(editId, {
        text: fields.text,
        room_id: fields.roomId,
        related_item_id: fields.relatedItemId,
        due_date: fields.dueDate,
        due_time: fields.dueTime,
        url: fields.url,
      });
      router.push(`/tasks/view?id=${editId}`);
    } else {
      await createTask(fields);
      setText("");
      setUrl("");
      setDueTime("");
      setFeedback(`「${fields.text}」を追加しました。`);
    }
  }

  const saudiRooms = roomsByCountry("saudi");
  const japanRooms = roomsByCountry("japan");

  return (
    <main className="board" data-screen="task-add">
      <section className="card page task-add-page" style={{ "--accent": "var(--orange)" }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <h2 className="page__title">{editId ? "タスクを編集" : "タスクを追加"}</h2>

        <form className="quickpin quickpin--stack" onSubmit={handleSubmit}>
          <input
            type="text"
            className="quickpin__input"
            placeholder="タスク名"
            maxLength={140}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select className="quickpin__select" value={roomId} onChange={(e) => { setRoomId(e.target.value); setRelatedItemId(""); }}>
            <option value="">未分類</option>
            <optgroup label="サウジアラビア">
              {saudiRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="日本">
              {japanRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </optgroup>
          </select>
          {roomItems.length > 0 && (
            <select className="quickpin__select" value={relatedItemId} onChange={(e) => setRelatedItemId(e.target.value)}>
              <option value="">関連する項目なし</option>
              {roomItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
          <div className="quickpin quickpin--row">
            <input type="date" className="quickpin__input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <input type="time" className="quickpin__input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
          <input
            type="url"
            className="quickpin__input"
            placeholder="リンク（任意）https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" className="quickpin__add quickpin__add--wide">
            {editId ? "更新する" : "追加する"}
          </button>
        </form>
        {feedback && <p className="page__hint">{feedback}</p>}
      </section>
    </main>
  );
}
