"use client";

import { useEffect, useState } from "react";
import { isGoogleConnected } from "@/lib/googleAuth";
import { listUpcomingEvents } from "@/lib/googleCalendar";

function formatEventTime(ev) {
  const start = ev.start?.dateTime || ev.start?.date;
  if (!start) return "";
  const d = new Date(start);
  if (ev.start?.dateTime) {
    return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
  }
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(d) + "（終日）";
}

export default function GoogleEventsCard() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState(null);

  useEffect(() => {
    const ok = isGoogleConnected();
    setConnected(ok);
    if (ok) {
      listUpcomingEvents(6).then(setEvents);
    }
  }, []);

  if (!connected) return null;

  return (
    <section className="card card--quickmemo" style={{ "--reveal": 2, "--accent": "var(--purple)" }}>
      <div className="card__head">
        <span className="badge badge--icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <use href="#i-idea" />
          </svg>
        </span>
        <h2>直近の予定（Googleカレンダー）</h2>
      </div>

      {events === null && <p className="item-list__empty">読み込み中…</p>}
      {events && events.length === 0 && <p className="item-list__empty">直近の予定はありません。</p>}
      {events && events.length > 0 && (
        <ul className="item-list">
          {events.map((ev) => (
            <li key={ev.id} className="item-list__row" style={{ cursor: "default" }}>
              <span className="item-list__main">
                <span className="item-list__title">{ev.summary || "（タイトルなし）"}</span>
                <span className="item-list__timestamp">{formatEventTime(ev)}</span>
              </span>
              {ev.htmlLink && (
                <span className="item-list__attachments">
                  <a className="item-list__link" href={ev.htmlLink} target="_blank" rel="noopener noreferrer">
                    <svg aria-hidden="true">
                      <use href="#i-link" />
                    </svg>
                    開く
                  </a>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
