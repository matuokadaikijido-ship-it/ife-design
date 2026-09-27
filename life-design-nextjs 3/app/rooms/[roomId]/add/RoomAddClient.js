"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROOMS, COUNTRY_LABEL, COUNTRY_ACCENT } from "@/lib/rooms";
import { createRoomItem, updateRoomItem, deleteRoomItem, fetchRoomItems } from "@/lib/data";
import { useDraft, clearDraft } from "@/lib/useDraft";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // Supabase Storage なので余裕を持って5MBまで

export default function RoomAddClient({ roomId }) {
  return (
    <Suspense fallback={null}>
      <RoomItemAddForm roomId={roomId} />
    </Suspense>
  );
}

function RoomItemAddForm({ roomId }) {
  const meta = ROOMS[roomId];
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [existing, setExisting] = useState(null);
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    fetchRoomItems(roomId).then((items) => {
      const item = items.find((i) => i.id === editId);
      if (item) {
        setExisting(item);
        setTitle(item.title);
        setNotes(item.notes || "");
        setUrl(item.url || "");
      }
    });
  }, [editId, roomId]);

  const DRAFT_KEY = `life-design-draft-room-item:${roomId}`;
  useDraft(
    DRAFT_KEY,
    { title, notes, url },
    (draft) => {
      if (draft.title) setTitle(draft.title);
      if (draft.notes) setNotes(draft.notes);
      if (draft.url) setUrl(draft.url);
    },
    { skip: !!editId }
  );

  if (!meta) return <p>ページが見つかりません。</p>;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (file && file.size > MAX_ATTACHMENT_BYTES) {
      setWarning("添付ファイルが大きすぎます（5MBまで）。");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateRoomItem(editId, { title: title.trim(), notes: notes.trim(), url: url.trim() }, file, false);
        router.push(`/items?id=${editId}`);
      } else {
        await createRoomItem(roomId, { title: title.trim(), notes: notes.trim(), url: url.trim() }, file);
        setTitle("");
        setNotes("");
        setUrl("");
        setFile(null);
        clearDraft(DRAFT_KEY);
        router.refresh();
      }
    } catch (err) {
      setWarning("保存に失敗しました。もう一度お試しください。");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!editId) return;
    const label = existing ? existing.title : "この項目";
    const warn = existing && existing.attachment_path
      ? `「${label}」を削除しますか？添付ファイルも一緒に削除され、元に戻せません。`
      : `「${label}」を削除しますか？この操作は取り消せません。`;
    if (!confirm(warn)) return;
    await deleteRoomItem(editId);
    router.push(`/rooms/${roomId}`);
  }

  return (
    <main className="board" data-screen="room-edit">
      <section className="card page room-edit-page" style={{ "--accent": COUNTRY_ACCENT[meta.country] }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <p className="page__breadcrumb">{COUNTRY_LABEL[meta.country]}</p>
        <h2 className="page__title">{editId ? "項目を編集" : `${meta.label} に追加`}</h2>

        <form className="quickpin quickpin--stack" onSubmit={handleSubmit}>
          <input
            type="text"
            className="quickpin__input"
            placeholder="題名"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="quickpin__input"
            placeholder="備考（任意）"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <input
            type="url"
            className="quickpin__input"
            placeholder="リンク（任意）https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <label className="file-field">
            <svg className="file-field__icon" aria-hidden="true">
              <use href="#i-paperclip" />
            </svg>
            <span>
              {file ? file.name : existing && existing.attachment_name ? `添付済み: ${existing.attachment_name}（変更する場合のみ選択）` : "画像・書類を添付（任意）"}
            </span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {warning && <p className="page__hint page__hint--warn">{warning}</p>}
          <button type="submit" className="quickpin__add quickpin__add--wide" disabled={saving}>
            {editId ? "保存する" : "追加する"}
          </button>
        </form>

        {editId && (
          <button type="button" className="danger-link" onClick={handleDelete}>
            この項目を削除
          </button>
        )}
      </section>
    </main>
  );
}
