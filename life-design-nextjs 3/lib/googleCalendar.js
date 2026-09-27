"use client";

import { getValidAccessToken } from "./googleAuth";

const CALENDAR_ID = "primary";
const BASE = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`;

async function authedFetch(url, options = {}) {
  const token = await getValidAccessToken();
  if (!token) return null;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    console.error("Google Calendar API error", res.status, await res.text());
    return null;
  }
  if (res.status === 204) return {};
  return res.json();
}

function taskToEventBody(task) {
  const summary = task.text;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (task.due_time) {
    const start = `${task.due_date}T${task.due_time.slice(0, 8)}`;
    const end = addMinutesToTime(task.due_date, task.due_time, 30);
    return {
      summary,
      description: task.url || undefined,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
    };
  }
  // 時刻未指定なら終日予定にする（終日予定はtimeZone不要）
  return {
    summary,
    description: task.url || undefined,
    start: { date: task.due_date },
    end: { date: task.due_date },
  };
}

function addMinutesToTime(dateStr, timeStr, minutes) {
  const d = new Date(`${dateStr}T${timeStr.slice(0, 8)}`);
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

// タスクに対応する予定をGoogleカレンダーに作成し、event.idを返す。
export async function createCalendarEvent(task) {
  const data = await authedFetch(BASE, {
    method: "POST",
    body: JSON.stringify(taskToEventBody(task)),
  });
  return data?.id || null;
}

export async function updateCalendarEvent(googleEventId, task) {
  if (!googleEventId) return;
  await authedFetch(`${BASE}/${googleEventId}`, {
    method: "PATCH",
    body: JSON.stringify(taskToEventBody(task)),
  });
}

export async function deleteCalendarEvent(googleEventId) {
  if (!googleEventId) return;
  await authedFetch(`${BASE}/${googleEventId}`, { method: "DELETE" });
}

// ホーム画面などに表示する、直近の予定一覧を取得する。
export async function listUpcomingEvents(maxResults = 8) {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });
  const data = await authedFetch(`${BASE}?${params.toString()}`);
  return data?.items || [];
}
