import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';
import { WIKI_SLUG } from '@/lib/wiki';
import { WikiRevertButton } from '@/components/wiki/wiki-revert-button';

export const metadata = { title: '편집 이력 · 공은위키' };

interface RevRow {
  id: string;
  summary: string | null;
  created_at: string;
  editor: { display_name: string | null; username: string } | null;
}

export default async function WikiHistoryPage() {
  const supabase = createClient();

  const { data: doc } = await supabase
    .from('wiki_documents')
    .select('id')
    .eq('slug', WIKI_SLUG)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let revs: RevRow[] = [];
  if (doc) {
    const { data } = await supabase
      .from('wiki_revisions')
      .select(
        'id, summary, created_at, editor:profiles!wiki_revisions_editor_id_fkey(display_name, username)'
      )
      .eq('document_id', doc.id)
      .order('created_at', { ascending: false });

    revs = (data ?? []).map((r) => ({
      ...r,
      editor: Array.isArray(r.editor) ? r.editor[0] : r.editor,
    })) as RevRow[];
  }

  return (
    <div className="space-y-5">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        공은위키
      </Link>

      <div className="flex items-center gap-2 text-primary">
        <History className="h-5 w-5" />
        <h1 className="text-xl font-bold">편집 이력</h1>
      </div>

      {revs.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          아직 편집 이력이 없어요.
        </div>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-card/40">
          {revs.map((rev, idx) => (
            <li key={rev.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm text-white/90">
                  <span className="truncate">
                    {rev.summary || (idx === 0 ? '최신 편집' : '편집')}
                  </span>
                  {idx === 0 && (
                    <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      현재
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {rev.editor?.display_name ?? rev.editor?.username ?? '알 수 없음'} ·{' '}
                  {timeAgo(rev.created_at)}
                </p>
              </div>
              {user && idx !== 0 && <WikiRevertButton revisionId={rev.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
