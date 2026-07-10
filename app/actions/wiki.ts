'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { WIKI_SLUG } from '@/lib/wiki';

const saveSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(120),
  content: z.string().max(200_000).default(''),
  summary: z.string().max(200).optional(),
});

/**
 * 단일 위키 문서 저장 (없으면 생성) + 리비전 1건 기록.
 * 인라인 편집용이라 redirect 하지 않고 결과만 반환한다.
 */
export async function saveWiki(input: {
  title: string;
  content: string;
  summary?: string;
}) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }
  const { title, content, summary } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: existing } = await supabase
    .from('wiki_documents')
    .select('id')
    .eq('slug', WIKI_SLUG)
    .maybeSingle();

  let documentId: string;

  if (existing) {
    const { error } = await supabase
      .from('wiki_documents')
      .update({
        title,
        content,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) return { error: '저장 중 오류가 발생했어요' };
    documentId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from('wiki_documents')
      .insert({
        slug: WIKI_SLUG,
        title,
        content,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();
    if (error || !created) return { error: '문서 생성 중 오류가 발생했어요' };
    documentId = created.id;
  }

  await supabase.from('wiki_revisions').insert({
    document_id: documentId,
    title,
    content,
    editor_id: user.id,
    summary: summary?.trim() || null,
  });

  revalidatePath('/wiki');
  return { ok: true };
}

/**
 * 특정 리비전으로 되돌리기 (새 리비전으로 기록) → /wiki 로 이동
 */
export async function revertWiki(input: { revisionId: string }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: doc } = await supabase
    .from('wiki_documents')
    .select('id')
    .eq('slug', WIKI_SLUG)
    .maybeSingle();
  if (!doc) return { error: '문서를 찾을 수 없습니다' };

  const { data: rev } = await supabase
    .from('wiki_revisions')
    .select('title, content')
    .eq('id', input.revisionId)
    .eq('document_id', doc.id)
    .maybeSingle();
  if (!rev) return { error: '해당 버전을 찾을 수 없습니다' };

  const { error } = await supabase
    .from('wiki_documents')
    .update({
      title: rev.title,
      content: rev.content,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', doc.id);
  if (error) return { error: '되돌리는 중 오류가 발생했어요' };

  await supabase.from('wiki_revisions').insert({
    document_id: doc.id,
    title: rev.title,
    content: rev.content,
    editor_id: user.id,
    summary: '이전 버전으로 되돌림',
  });

  revalidatePath('/wiki');
  redirect('/wiki');
}
