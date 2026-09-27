"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROOMS, COUNTRY_LABEL, COUNTRY_ACCENT } from "@/lib/rooms";
import { fetchItemById, attachmentUrl } from "@/lib/data";
import { formatTimestamp } from "@/components/TaskList";

export default function ItemDetailPage() {
  return (
    <Suspense fallback={null}>
      <ItemDetailInner />
    </Suspense>
  );
}

function ItemDetailInner() {
  const itemId = useSearchParams().get("id");
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    fetchItemById(itemId).then((data) => {
      setItem(data);
      setLoading(false);
    });
  }, [itemId]);

  if (loading) return null;
  if (!item) return <p>項目が見つかりませんでした。</p>;

  const meta = ROOMS[item.room_id] || { country: "general", label: item.room_id };
  const isImage = item.attachment_type && item.attachment_type.indexOf("image/") === 0;

  return (
    <main className="board" data-screen="item-detail">
      <section className="card page item-detail-page" style={{ "--accent": COUNTRY_ACCENT[meta.country] }}>
        <button type="button" className="page__back" onClick={() => router.back()}>
          <svg className="chev chev--back" aria-hidden="true">
            <use href="#i-chevron" />
          </svg>
          戻る
        </button>
        <p className="page__breadcrumb">{COUNTRY_LABEL[meta.country]}</p>
        <div className="page__title-row">
          <h2 className="page__title">{item.title}</h2>
          <Link href={`/rooms/${item.room_id}/add?edit=${item.id}`} className="page__edit">
            編集
          </Link>
        </div>

        {item.notes && <p className="detail__notes">{item.notes}</p>}

        {(item.url || item.attachment_path) && (
          <div className="detail__resource-row">
            {item.attachment_path && isImage && (
              <img className="detail__attachment-image" src={attachmentUrl(item.attachment_path)} alt={item.attachment_name || "添付画像"} />
            )}
            {item.attachment_path && (
              <a className="detail__chip" href={attachmentUrl(item.attachment_path)} download={item.attachment_name} target="_blank" rel="noopener noreferrer">
                <svg aria-hidden="true">
                  <use href="#i-paperclip" />
                </svg>
                {isImage ? "画像を保存" : `${item.attachment_name || "添付ファイル"}を保存`}
              </a>
            )}
            {item.url && (
              <a className="detail__chip" href={item.url} target="_blank" rel="noopener noreferrer">
                <svg aria-hidden="true">
                  <use href="#i-link" />
                </svg>
                リンクを開く
              </a>
            )}
          </div>
        )}

        <p className="item-list__timestamp">{formatTimestamp(item.created_at)}</p>
      </section>
    </main>
  );
}
