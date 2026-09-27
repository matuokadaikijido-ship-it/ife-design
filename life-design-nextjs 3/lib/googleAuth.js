"use client";

import { supabase } from "./supabase";

const STORAGE_KEY = "life-design-google-tokens";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

function loadTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveTokens(tokens) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (e) {
    /* 無視 */
  }
}

export function clearGoogleTokens() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* 無視 */
  }
}

export function isGoogleConnected() {
  return !!loadTokens()?.refresh_token;
}

// 「Googleでログイン」ボタンから呼ぶ。同意画面を経て戻ってきた後、
// captureTokensFromSession() でトークンを保存する。
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: SCOPES,
      queryParams: {
        access_type: "offline", // リフレッシュトークンをもらうために必須
        prompt: "consent",       // 毎回同意画面を出し、確実にリフレッシュトークンを受け取る
      },
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

// Supabaseのsessionオブジェクトから、Googleのトークンを取り出して保存する共通処理。
function captureFromSessionObject(session) {
  if (!session?.provider_token) return false;
  const existing = loadTokens() || {};
  saveTokens({
    access_token: session.provider_token,
    refresh_token: session.provider_refresh_token || existing.refresh_token || null,
    expires_at: Date.now() + 55 * 60 * 1000, // 55分後を期限とみなす（実際は1時間）
  });
  return true;
}

// アプリ起動時に呼ぶ。すでに確立済みのセッションにトークンが載っていれば拾う。
export async function captureTokensFromSession() {
  const { data } = await supabase.auth.getSession();
  captureFromSessionObject(data?.session);
}

// OAuthのコールバック直後は、getSession() のタイミングが早すぎてトークンを
// 取りこぼすことがあるため、onAuthStateChange でも確実に拾えるようにする。
// レイアウトなど、アプリ起動時に一度だけ呼び出す想定。
export function watchGoogleAuthState(onConnected) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (captureFromSessionObject(session)) {
      onConnected && onConnected();
    }
  });
  return () => data.subscription.unsubscribe();
}

export function disconnectGoogle() {
  clearGoogleTokens();
}

// 有効なアクセストークンを返す。期限切れならNetlify Functionでリフレッシュする。
export async function getValidAccessToken() {
  const tokens = loadTokens();
  if (!tokens) return null;

  if (tokens.access_token && tokens.expires_at && Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) return null;

  const res = await fetch("/.netlify/functions/refresh-google-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!res.ok) {
    // リフレッシュトークン自体が失効している場合など。再ログインが必要。
    clearGoogleTokens();
    return null;
  }
  const data = await res.json();
  const updated = {
    ...tokens,
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 300) * 1000, // 5分の余裕を持たせる
  };
  saveTokens(updated);
  return updated.access_token;
}
