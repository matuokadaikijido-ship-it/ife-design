"use client";

import Link from "next/link";
import { attachmentUrl } from "@/lib/data";
import { formatTimestamp } from "./TaskList";

export default function ItemList({ items, emptyText = "まだ項目がありません。右上の「＋追加」から追加できます。" }) {
  if (!items.length) {
    return <p className="item-list__empty">{emptyText}</p>;
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id} className="item-list__row" onClick={() => window.location.assign(`/items?id=${item.id}`)}>
          <span className="item-list__main">
            <span className="item-list__title">{item.title}</span>
            {item.notes && <span className="item-list__notes">{item.notes}</span>}
            {item.created_at && <span className="item-list__timestamp">{formatTimestamp(item.created_at)}</span>}
          </span>

          {(item.url || item.attachment_path) && (
            <span className="item-list__attachments">
              {item.url && (
                <a
                  className="item-list__link"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg aria-hidden="true">
                    <use href="#i-link" />
                  </svg>
                  リンク
                </a>
              )}
              {item.attachment_path &&
                (item.attachment_type && item.attachment_type.indexOf("image/") === 0 ? (
                  <a
                    href={attachmentUrl(item.attachment_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img className="item-list__thumb" src={attachmentUrl(item.attachment_path)} alt={item.attachment_name || "添付画像"} />
                  </a>
                ) : (
                  <a
                    className="item-list__link"
                    href={attachmentUrl(item.attachment_path)}
                    download={item.attachment_name}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg aria-hidden="true">
                      <use href="#i-paperclip" />
                    </svg>
                    {item.attachment_name || "添付ファイル"}
                  </a>
                ))}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
