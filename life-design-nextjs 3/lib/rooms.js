export const ROOMS = {
  "saudi-coaching":   { country: "saudi", label: "コーチングスケジュール" },
  "saudi-life":       { country: "saudi", label: "暮らしの情報" },
  "saudi-manual":     { country: "saudi", label: "マニュアル・資料" },
  "saudi-procedures": { country: "saudi", label: "手続き関係" },
  "saudi-services":   { country: "saudi", label: "現地サービス・お気に入り店" },
  "japan-procedures": { country: "japan", label: "各種手続き・行政" },
  "japan-contacts":   { country: "japan", label: "日本連絡先・用件" },
  "japan-archive":    { country: "japan", label: "アーカイブ・メモ" },
  "japan-return":     { country: "japan", label: "一時帰国スケジュール" },
  "japan-family":     { country: "japan", label: "家族・実家まわり" },
  "quick-memo":       { country: "general", label: "クイックメモ" },
};

export const COUNTRY_LABEL = { saudi: "サウジアラビア", japan: "日本", general: "クイックメモ" };
export const COUNTRY_ACCENT = { saudi: "var(--green)", japan: "var(--purple)", general: "var(--orange)" };

export function roomsByCountry(country) {
  return Object.entries(ROOMS)
    .filter(([, meta]) => meta.country === country)
    .map(([id, meta]) => ({ id, ...meta }));
}
