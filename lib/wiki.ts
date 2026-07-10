import GithubSlugger from 'github-slugger';

/**
 * 공은위키는 단일 문서(한 페이지)로 운영한다.
 * 이 고정 slug 한 행만 wiki_documents 에 존재한다.
 */
export const WIKI_SLUG = 'home';
export const WIKI_DEFAULT_TITLE = '공은위키';

export interface WikiRevision {
  id: string;
  title: string;
  content: string;
  editor_id: string | null;
  summary: string | null;
  created_at: string;
}

export interface TocItem {
  level: number; // 정규화된 레벨 (1부터)
  text: string;
  id: string; // rehype-slug 과 동일한 앵커 id
  number: string; // "1", "1.1", "2" …
}

/** 인라인 마크다운 문법 제거 → 목차/앵커용 순수 텍스트 */
function stripInline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // 이미지
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // 링크
    .replace(/(\*\*|__|\*|_|~~|`)/g, '') // 강조/코드
    .trim();
}

/**
 * 마크다운 본문에서 목차(heading) 추출.
 * - 코드펜스(``` ~~~) 안의 # 은 무시
 * - id 는 github-slugger 로 생성 → Markdown 렌더러의 rehype-slug 와 일치
 * - 문서에서 가장 얕은 heading 을 레벨1로 정규화 (## 로 시작해도 1부터)
 */
export function extractWikiToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const lines = markdown.split('\n');
  let inFence = false;

  const raw: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = stripInline(m[2]);
    if (!text) continue;
    raw.push({ level: m[1].length, text, id: slugger.slug(text) });
  }
  if (raw.length === 0) return [];

  const minLevel = Math.min(...raw.map((r) => r.level));
  const counters: number[] = [];
  return raw.map((r) => {
    const level = r.level - minLevel + 1;
    counters.length = level; // 더 깊은 카운터 잘라내기
    counters[level - 1] = (counters[level - 1] ?? 0) + 1;
    const number = counters.map((n) => n ?? 0).join('.');
    return { level, text: r.text, id: r.id, number };
  });
}
