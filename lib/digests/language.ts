export const DIGEST_LANGUAGES = [
  { value: "en", label: "English", englishName: "English" },
  { value: "zh-CN", label: "简体中文", englishName: "Simplified Chinese" },
  { value: "zh-TW", label: "繁體中文", englishName: "Traditional Chinese" },
  { value: "ja", label: "日本語", englishName: "Japanese" },
  { value: "ko", label: "한국어", englishName: "Korean" },
  { value: "es", label: "Español", englishName: "Spanish" },
  { value: "fr", label: "Français", englishName: "French" },
  { value: "de", label: "Deutsch", englishName: "German" },
  { value: "pt-BR", label: "Português (Brasil)", englishName: "Brazilian Portuguese" },
] as const;

export type DigestLanguage = (typeof DIGEST_LANGUAGES)[number]["value"];

export const DEFAULT_DIGEST_LANGUAGE: DigestLanguage = "en";

const DIGEST_LANGUAGE_SET = new Set<string>(
  DIGEST_LANGUAGES.map((item) => item.value)
);

export function isDigestLanguage(value: string): value is DigestLanguage {
  return DIGEST_LANGUAGE_SET.has(value);
}

export function normalizeDigestLanguage(
  value: string | null | undefined
): DigestLanguage {
  if (value && isDigestLanguage(value)) return value;
  return DEFAULT_DIGEST_LANGUAGE;
}

export function digestLanguageEnglishName(language: DigestLanguage): string {
  return (
    DIGEST_LANGUAGES.find((item) => item.value === language)?.englishName ??
    "English"
  );
}

const INTL_LOCALE: Record<DigestLanguage, string> = {
  en: "en-US",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  ja: "ja-JP",
  ko: "ko-KR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  "pt-BR": "pt-BR",
};

export function formatDigestWeekKey(
  weekKey: string,
  language: DigestLanguage
): string {
  const [y, m, d] = weekKey.split("-").map((n) => Number(n));
  if (!y || !m || !d) return weekKey;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(INTL_LOCALE[language], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export type DigestEmailCopy = {
  highlightsStat: string;
  bookmarksStat: string;
  yourHighlights: string;
  highlightOne: string;
  highlightMany: string;
  alsoBookmarked: string;
  readOnX: string;
  footer: string;
  unsubscribe: string;
  fromWeeklyDigests: string;
  subject: (weekKey: string) => string;
  fallbackOverview: (args: {
    highlightCount: number;
    topicCount: number;
    alsoCount: number;
  }) => string;
};

const COPY: Record<DigestLanguage, DigestEmailCopy> = {
  en: {
    highlightsStat: "Highlights",
    bookmarksStat: "Bookmarks",
    yourHighlights: "Your highlights",
    highlightOne: "highlight",
    highlightMany: "highlights",
    alsoBookmarked: "Also bookmarked",
    readOnX: "Read on X ↗",
    footer: "your bookmarks, summarized on your schedule.",
    unsubscribe: "Unsubscribe",
    fromWeeklyDigests: "from weekly digests",
    subject: (weekKey) => `Your WakeMark weekly digest — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `Your week on X at a glance — ${highlightCount} highlights across ${topicCount} ${topicCount === 1 ? "topic" : "topics"}, plus ${alsoCount} more bookmarks worth a scroll.`,
  },
  "zh-CN": {
    highlightsStat: "精选",
    bookmarksStat: "书签",
    yourHighlights: "本周精选",
    highlightOne: "篇精选",
    highlightMany: "篇精选",
    alsoBookmarked: "其他收藏",
    readOnX: "在 X 上阅读 ↗",
    footer: "按你的节奏，整理你收藏的内容。",
    unsubscribe: "退订",
    fromWeeklyDigests: "每周摘要邮件",
    subject: (weekKey) => `你的 WakeMark 本周摘要 — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `本周 X 收藏一览：${topicCount} 个主题共 ${highlightCount} 条精选，另有 ${alsoCount} 条收藏可继续翻看。`,
  },
  "zh-TW": {
    highlightsStat: "精選",
    bookmarksStat: "書籤",
    yourHighlights: "本週精選",
    highlightOne: "則精選",
    highlightMany: "則精選",
    alsoBookmarked: "其他收藏",
    readOnX: "在 X 上閱讀 ↗",
    footer: "依你的節奏，整理你收藏的內容。",
    unsubscribe: "取消訂閱",
    fromWeeklyDigests: "每週摘要郵件",
    subject: (weekKey) => `你的 WakeMark 本週摘要 — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `本週 X 收藏一覽：${topicCount} 個主題共 ${highlightCount} 則精選，另有 ${alsoCount} 則收藏可繼續翻看。`,
  },
  ja: {
    highlightsStat: "ハイライト",
    bookmarksStat: "ブックマーク",
    yourHighlights: "今週のハイライト",
    highlightOne: "件",
    highlightMany: "件",
    alsoBookmarked: "その他の保存",
    readOnX: "X で読む ↗",
    footer: "あなたのブックマークを、あなたのペースで要約します。",
    unsubscribe: "配信停止",
    fromWeeklyDigests: "週次ダイジェストの配信",
    subject: (weekKey) => `WakeMark 今週のダイジェスト — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `今週の X ブックマーク：${topicCount} トピックから ${highlightCount} 件のハイライト、ほか ${alsoCount} 件も保存されています。`,
  },
  ko: {
    highlightsStat: "하이라이트",
    bookmarksStat: "북마크",
    yourHighlights: "이번 주 하이라이트",
    highlightOne: "개",
    highlightMany: "개",
    alsoBookmarked: "그 외 저장",
    readOnX: "X에서 읽기 ↗",
    footer: "북마크를 당신 일정에 맞춰 요약합니다.",
    unsubscribe: "구독 취소",
    fromWeeklyDigests: "주간 다이제스트",
    subject: (weekKey) => `WakeMark 주간 다이제스트 — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `이번 주 X 북마크 요약: ${topicCount}개 주제에서 ${highlightCount}개 하이라이트, 그 외 ${alsoCount}개도 저장되어 있습니다.`,
  },
  es: {
    highlightsStat: "Destacados",
    bookmarksStat: "Marcadores",
    yourHighlights: "Tus destacados",
    highlightOne: "destacado",
    highlightMany: "destacados",
    alsoBookmarked: "También guardado",
    readOnX: "Leer en X ↗",
    footer: "tus marcadores, resumidos a tu ritmo.",
    unsubscribe: "Cancelar suscripción",
    fromWeeklyDigests: "del resumen semanal",
    subject: (weekKey) => `Tu resumen semanal de WakeMark — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `Tu semana en X de un vistazo: ${highlightCount} destacados en ${topicCount} ${topicCount === 1 ? "tema" : "temas"}, más ${alsoCount} marcadores para seguir leyendo.`,
  },
  fr: {
    highlightsStat: "À retenir",
    bookmarksStat: "Signets",
    yourHighlights: "Vos extraits",
    highlightOne: "extrait",
    highlightMany: "extraits",
    alsoBookmarked: "Aussi enregistrés",
    readOnX: "Lire sur X ↗",
    footer: "vos signets, résumés selon votre rythme.",
    unsubscribe: "Se désabonner",
    fromWeeklyDigests: "des résumés hebdomadaires",
    subject: (weekKey) => `Votre digest WakeMark de la semaine — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `Votre semaine sur X : ${highlightCount} extraits dans ${topicCount} ${topicCount === 1 ? "thème" : "thèmes"}, plus ${alsoCount} autres signets à parcourir.`,
  },
  de: {
    highlightsStat: "Highlights",
    bookmarksStat: "Lesezeichen",
    yourHighlights: "Deine Highlights",
    highlightOne: "Highlight",
    highlightMany: "Highlights",
    alsoBookmarked: "Weitere Lesezeichen",
    readOnX: "Auf X lesen ↗",
    footer: "deine Lesezeichen, zusammengefasst in deinem Tempo.",
    unsubscribe: "Abmelden",
    fromWeeklyDigests: "vom wöchentlichen Digest",
    subject: (weekKey) => `Dein WakeMark-Wochenüberblick — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `Deine Woche auf X: ${highlightCount} Highlights in ${topicCount} ${topicCount === 1 ? "Thema" : "Themen"}, plus ${alsoCount} weitere Lesezeichen.`,
  },
  "pt-BR": {
    highlightsStat: "Destaques",
    bookmarksStat: "Salvos",
    yourHighlights: "Seus destaques",
    highlightOne: "destaque",
    highlightMany: "destaques",
    alsoBookmarked: "Também salvos",
    readOnX: "Ler no X ↗",
    footer: "seus salvos, resumidos no seu ritmo.",
    unsubscribe: "Cancelar inscrição",
    fromWeeklyDigests: "dos resumos semanais",
    subject: (weekKey) => `Seu resumo semanal do WakeMark — ${weekKey}`,
    fallbackOverview: ({ highlightCount, topicCount, alsoCount }) =>
      `Sua semana no X: ${highlightCount} destaques em ${topicCount} ${topicCount === 1 ? "tema" : "temas"}, mais ${alsoCount} itens salvos para continuar lendo.`,
  },
};

export function digestEmailCopy(language: DigestLanguage): DigestEmailCopy {
  return COPY[language] ?? COPY.en;
}
