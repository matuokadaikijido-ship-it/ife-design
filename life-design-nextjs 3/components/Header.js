"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegion } from "./RegionProvider";
import { signInWithGoogle, captureTokensFromSession, watchGoogleAuthState, isGoogleConnected, disconnectGoogle } from "@/lib/googleAuth";

function useClock(timeZone) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!now) return { time: "--:--", date: "\u00a0" };
  return {
    time: new Intl.DateTimeFormat("ja-JP", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(now),
    date: new Intl.DateTimeFormat("ja-JP", { timeZone, month: "numeric", day: "numeric", weekday: "short" }).format(now),
  };
}

export default function Header() {
  const riyadh = useClock("Asia/Riyadh");
  const tokyo = useClock("Asia/Tokyo");
  const { region, setRegion } = useRegion();
  const [turns, setTurns] = useState(0);
  const [connected, setConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    captureTokensFromSession().then(() => setConnected(isGoogleConnected()));
    const unwatch = watchGoogleAuthState(() => setConnected(true));
    return unwatch;
  }, []);

  return (
    <header className="masthead">
      <div className="masthead__title">
        <h1>
          Life <em>Design.</em>
        </h1>
      </div>

      <div className="masthead__right">
        <div className="clocks" role="group" aria-label="現地時刻">
          <div className="clock">
            <span className="clock__place">
              リヤド<span className="clock__code">RUH</span>
            </span>
            <span className="clock__time">{riyadh.time}</span>
            <span className="clock__date">{riyadh.date}</span>
          </div>
          <div className="clock clock--jp">
            <span className="clock__place">
              東京<span className="clock__code">TYO</span>
            </span>
            <span className="clock__time">{tokyo.time}</span>
            <span className="clock__date">{tokyo.date}</span>
          </div>
        </div>

        <div className="header-actions">
          <Link href="/tasks/add" className="header-btn header-btn--label">
            ＋ 追加
          </Link>
          <Link href="/tasks" className="header-btn header-btn--label">
            全タスク
          </Link>
          <button
            type="button"
            className="header-btn header-btn--label"
            onClick={() => {
              if (connected) {
                if (confirm("Googleカレンダーとの連携を解除しますか？")) {
                  disconnectGoogle();
                  setConnected(false);
                }
              } else {
                signInWithGoogle();
              }
            }}
          >
            {connected ? "カレンダー連携ずみ" : "Googleカレンダー連携"}
          </button>
        </div>

        <button
          type="button"
          className="region-toggle"
          aria-label={`表示地域を切り替える(現在: ${region === "saudi" ? "サウジアラビア" : "日本"})`}
          onClick={() => {
            setTurns((t) => t + 1);
            setRegion(region === "saudi" ? "japan" : "saudi");
            router.push("/");
          }}
        >
          <svg className="region-toggle__icon" style={{ "--turns": turns }} aria-hidden="true">
            <use href="#i-swap" />
          </svg>
          <span className="region-toggle__code">{region === "saudi" ? "SA" : "JP"}</span>
        </button>
      </div>
    </header>
  );
}
