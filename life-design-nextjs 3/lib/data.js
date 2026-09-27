import { supabase } from "./supabase";
import { isGoogleConnected } from "./googleAuth";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "./googleCalendar";

/* ---------------- タスク ---------------- */

export async function fetchTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTask(fields) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      text: fields.text,
      kind: fields.kind || "task",
      room_id: fields.roomId || null,
      related_item_id: fields.relatedItemId || null,
      due_date: fields.dueDate,
      due_time: fields.dueTime || null,
      url: fields.url || null,
      pinned: !!fields.pinned,
    })
    .select()
    .single();
  if (error) throw error;

  if (isGoogleConnected() && data.kind === "event" && data.due_date) {
    const googleEventId = await createCalendarEvent(data);
    if (googleEventId) {
      await supabase.from("tasks").update({ google_event_id: googleEventId }).eq("id", data.id);
      data.google_event_id = googleEventId;
    }
  }
  return data;
}

export async function updateTaskFields(id, patch) {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  if (isGoogleConnected()) {
    if (data.kind === "event" && data.due_date) {
      if (data.google_event_id) {
        await updateCalendarEvent(data.google_event_id, data);
      } else {
        const googleEventId = await createCalendarEvent(data);
        if (googleEventId) {
          await supabase.from("tasks").update({ google_event_id: googleEventId }).eq("id", data.id);
          data.google_event_id = googleEventId;
        }
      }
    } else if (data.google_event_id) {
      // タスクに変わった／期限が消えた場合は、カレンダー側の予定を消す
      await deleteCalendarEvent(data.google_event_id);
      await supabase.from("tasks").update({ google_event_id: null }).eq("id", data.id);
      data.google_event_id = null;
    }
  }
  return data;
}

export async function deleteTaskById(id) {
  const { data } = await supabase.from("tasks").select("google_event_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;

  if (isGoogleConnected() && data?.google_event_id) {
    await deleteCalendarEvent(data.google_event_id);
  }
}

/* ---------------- 部屋・クイックメモの項目 ---------------- */

export async function fetchRoomItems(roomId) {
  const { data, error } = await supabase
    .from("room_items")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchItemById(id) {
  const { data, error } = await supabase.from("room_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllItems() {
  const { data, error } = await supabase
    .from("room_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createRoomItem(roomId, fields, file) {
  let attachment = { attachment_path: null, attachment_name: null, attachment_type: null };
  if (file) attachment = await uploadAttachment(file);

  const { data, error } = await supabase
    .from("room_items")
    .insert({
      room_id: roomId,
      title: fields.title,
      notes: fields.notes || null,
      url: fields.url || null,
      ...attachment,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoomItem(id, fields, file, removeAttachment) {
  const patch = {
    title: fields.title,
    notes: fields.notes || null,
    url: fields.url || null,
  };
  if (file) {
    Object.assign(patch, await uploadAttachment(file));
  } else if (removeAttachment) {
    patch.attachment_path = null;
    patch.attachment_name = null;
    patch.attachment_type = null;
  }
  const { data, error } = await supabase
    .from("room_items")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoomItem(id) {
  const { error } = await supabase.from("room_items").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- 添付ファイル（Supabase Storage） ---------------- */

const BUCKET = "attachments";

async function uploadAttachment(file) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return { attachment_path: path, attachment_name: file.name, attachment_type: file.type };
}

export function attachmentUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- 個人設定（表示地域・並び替えなど） ---------------- */

export async function getSetting(key, fallback) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.value;
}

export async function setSetting(key, value) {
  await supabase.from("app_settings").upsert({ key, value });
}
