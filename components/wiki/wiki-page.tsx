'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, History, Clock, Eye, Loader2, ListTree, LogIn } from 'lucide-react';
import { saveWiki } from '@/app/actions/wiki';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/wiki/markdown';
import { extractWikiToc, WIKI_DEFAULT_TITLE } from '@/lib/wiki';

interface WikiPageProps {
  initialTitle: string;
  initialContent: string;
  updatedLabel: string | null;
  editorName: string | null;
  canEdit: boolean;
}

export function WikiPage({
  initialTitle,
  initialContent,
  updatedLabel,
  editorName,
  canEdit,
}: WikiPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);

  // 편집 중 임시값
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftContent, setDraftContent] = useState(initialContent);
  const [summary, setSummary] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toc = useMemo(
    () => extractWikiToc(editing && preview ? draftContent : content),
    [editing, preview, draftContent, content]
  );

  const startEdit = () => {
    setDraftTitle(title);
    setDraftContent(content);
    setSummary('');
    setPreview(false);
    setError(null);
    setEditing(true);
  };

  const save = () => {
    setError(null);
    if (!draftTitle.trim() || !draftContent.trim()) {
      setError('제목과 내용을 입력해주세요');
      return;
    }
    startTransition(async () => {
      const res = await saveWiki({
        title: draftTitle.trim(),
        content: draftContent.trim(),
        summary: summary.trim() || undefined,
      });
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      // 성공 → 화면 반영
      setTitle(draftTitle.trim());
      setContent(draftContent.trim());
      setEditing(false);
      router.refresh();
    });
  };

  // ── 편집 모드 ──
  if (editing) {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          maxLength={120}
          placeholder="문서 제목"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-lg font-bold focus:border-foreground focus:outline-none"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            마크다운 · 제목(##)으로 문단을 나누면 위에 목차가 자동 생성돼요
          </span>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
          >
            {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? '편집으로' : '미리보기'}
          </button>
        </div>

        {preview ? (
          <div className="rounded-md border border-border bg-background px-4 py-3">
            {toc.length > 0 && <TocBox toc={toc} />}
            {draftContent.trim() ? (
              <Markdown content={draftContent} />
            ) : (
              <p className="text-sm text-muted-foreground">미리볼 내용이 없어요.</p>
            )}
          </div>
        ) : (
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            rows={24}
            placeholder={'## 개요\n공은이는 ...\n\n## 방송 이력\n\n### 2024년\n- ...\n\n## 여담\n- ...'}
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-6 focus:border-foreground focus:outline-none"
          />
        )}

        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={200}
          placeholder="편집 요약 (선택) — 예: 오타 수정, 여담 추가"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
        />

        {error && (
          <div className="rounded-md border border-live/50 bg-live/10 p-3 text-sm text-live">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={isPending}>
            취소
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            저장하기
          </Button>
        </div>
      </div>
    );
  }

  // ── 보기 모드 ──
  const isEmpty = !content.trim();
  return (
    <article className="space-y-5">
      <header className="space-y-3 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-white">
          {title || WIKI_DEFAULT_TITLE}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {updatedLabel ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                {updatedLabel}
                {editorName && <span>· {editorName} 편집</span>}
              </>
            ) : (
              <span>아직 아무도 편집하지 않았어요</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/wiki/history"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
            >
              <History className="h-3.5 w-3.5" />
              편집 이력
            </Link>
            {canEdit ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90"
              >
                <Pencil className="h-3.5 w-3.5" />
                편집
              </button>
            ) : (
              <Link
                href="/login?redirect=/wiki"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90"
              >
                <LogIn className="h-3.5 w-3.5" />
                로그인하고 편집
              </Link>
            )}
          </div>
        </div>
      </header>

      {isEmpty ? (
        <div className="rounded-2xl border border-white/5 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          아직 내용이 없어요. {canEdit ? '“편집”을 눌러' : '로그인 후'} 첫 문서를 채워주세요!
        </div>
      ) : (
        <>
          {toc.length > 0 && <TocBox toc={toc} />}
          <Markdown content={content} />
        </>
      )}
    </article>
  );
}

/** 나무위키식 자동 목차 */
function TocBox({ toc }: { toc: ReturnType<typeof extractWikiToc> }) {
  return (
    <nav
      aria-label="목차"
      className="inline-block min-w-[14rem] max-w-full rounded-xl border border-white/10 bg-card/60 px-4 py-3"
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <ListTree className="h-3.5 w-3.5" />
        목차
      </div>
      <ul className="space-y-1 text-sm">
        {toc.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 0.9}rem` }}>
            <a
              href={`#${item.id}`}
              className="text-foreground/80 transition-colors hover:text-primary"
            >
              <span className="mr-1.5 text-muted-foreground">{item.number}.</span>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
