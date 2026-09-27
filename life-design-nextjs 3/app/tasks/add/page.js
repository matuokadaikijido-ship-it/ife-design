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

const KIND_LABEL = { event: "予定", task: "タスク" };

function TaskAddForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [kind, setKind] = useState("event");
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
      setKind(task.kind || "event");
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
    if (!text.trim()) return;
    if (kind === "event" && !dueDate) return;

    const fields = {
      text: text.trim(),
      kind,
      roomId: roomId || null,
      relatedItemId: relatedItemId || null,
      dueDate: dueDate || null,
      dueTime: kind === "event" ? dueTime || null : null,
      url: url.trim(),
    };

    if (editId) {
      await updateTaskFields(editId, {
        text: fields.text,
        kind: fields.kind,
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
      setFeedback(`「${fields.text}」を${KIND_LABEL[kind]}として追加しました。`);
    }
  }

  const saudiRooms = roomsByCountry("saudi");
  const japanRooms = roomsByCountry("japan");
  const title = editId ? `${KIND_LABEL[kind]}を編集` : `${KIND_LABEL[kind]}を追加`;

  return (
    <main className="board" data-screen="task-add">
      <section className="card page task-add-page" style={{ "--accent": "var(--orange)" }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <h2 className="page__title">{title}</h2>

        <div className="kind-toggle" role="group" aria-label="予定かタスクか">
          <button
            type="button"
            className={"kind-toggle__btn" + (kind === "event" ? " is-active" : "")}
            onClick={() => setKind("event")}
          >
            予定<span className="kind-toggle__hint">Googleカレンダーに同期</span>
          </button>
          <button
            type="button"
            className={"kind-toggle__btn" + (kind === "task" ? " is-active" : "")}
            onClick={() => setKind("task")}
          >
            タスク<span className="kind-toggle__hint">同期しない・todoだけ</span>
          </button>
        </div>

        <form className="quickpin quickpin--stack" onSubmit={handleSubmit}>
          <input
            type="text"
            className="quickpin__input"
            placeholder={kind === "event" ? "予定名" : "タスク名"}
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
            <input
              type="date"
              className="quickpin__input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder={kind === "task" ? "期限（任意）" : undefined}
              required={kind === "event"}
            />
            {kind === "event" && (
              <input type="time" className="quickpin__input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            )}
          </div>
          <input
            type="url"
            className="quickpin__input"
            placeholder="リンク（任意）https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" className="quickpin__add quickpin__add--wide">
            {editId ? "更新する" : `${KIND_LABEL[kind]}を追加する`}
          </button>
        </form>
        {feedback && <p className="page__hint">{feedback}</p>}
      </section>
    </main>
  );
}
