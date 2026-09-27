"use client";

import { useEffect, useRef } from "react";

// フォームの入力内容を、少し待ってから自動でlocalStorageに保存し、
// 次にページを開いたときに復元できるようにする。
// key: このフォーム専用の保存キー（フォームの種類ごとに分ける）
// state: 保存したい値のオブジェクト（例: { text, dueDate, ... }）
// setState: 復元時に呼ぶセッター（key -> 値 のオブジェクトを受け取って各stateに反映する関数）
// options.skip: trueの間は保存も復元もしない（編集モードのときなど）
export function useDraft(key, state, applyDraft, { skip = false } = {}) {
  const restored = useRef(false);

  // 初回だけ、保存されている下書きがあれば復元する
  useEffect(() => {
    if (skip || restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) applyDraft(JSON.parse(raw));
    } catch (e) {
      /* 無視 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  // 入力があるたびに、少し待ってから保存する（デバウンス）
  useEffect(() => {
    if (skip) return;
    const hasContent = Object.values(state).some((v) => v && String(v).trim());
    const timer = setTimeout(() => {
      try {
        if (hasContent) {
          localStorage.setItem(key, JSON.stringify(state));
        } else {
          localStorage.removeItem(key);
        }
      } catch (e) {
        /* 無視 */
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, JSON.stringify(state)]);
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* 無視 */
  }
}
