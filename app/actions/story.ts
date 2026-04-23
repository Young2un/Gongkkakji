'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// 스토리 유효기간 (시간)
const STORY_TTL_HOURS = 24;

export async function createStory(input: {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
}) {
  if (!input.mediaUrl) return { error: '미디어가 필요합니다' };
  if (input.mediaType !== 'image' && input.mediaType !== 'video') {
    return { error: '지원하지 않는 미디어 타입' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 3600 * 1000);

  const { data, error } = await supabase
    .from('stories')
    .insert({
      author_id: user.id,
      media_url: input.mediaUrl,
      media_type: input.mediaType,
      caption: input.caption?.trim() || null,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) return { error: '스토리 업로드에 실패했어요' };

  revalidatePath('/');
  return { data };
}

export async function markStoryViewed(storyId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // 본인 스토리는 조회 기록 안 남김
  const { data: story } = await supabase
    .from('stories')
    .select('author_id')
    .eq('id', storyId)
    .maybeSingle();
  if (!story || story.author_id === user.id) return { ok: false };

  // upsert: 이미 있으면 무시
  await supabase
    .from('story_views')
    .upsert(
      { story_id: storyId, viewer_id: user.id },
      { onConflict: 'story_id,viewer_id', ignoreDuplicates: true }
    );

  return { ok: true };
}

export async function saveStoryAsHighlight(input: {
  storyId: string;
  title?: string;
  existingHighlightId?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: story } = await supabase
    .from('stories')
    .select('id, author_id, media_url')
    .eq('id', input.storyId)
    .maybeSingle();
  if (!story) return { error: '스토리를 찾을 수 없어요' };
  if (story.author_id !== user.id)
    return { error: '본인 스토리만 하이라이트로 저장할 수 있어요' };

  let highlightId = input.existingHighlightId;

  if (!highlightId) {
    const title = input.title?.trim();
    if (!title) return { error: '하이라이트 제목을 입력해주세요' };

    const { data: highlight, error: hErr } = await supabase
      .from('highlights')
      .insert({
        owner_id: user.id,
        title,
        cover_url: story.media_url,
      })
      .select('id')
      .single();
    if (hErr || !highlight) return { error: '하이라이트 생성 실패' };
    highlightId = highlight.id;
  }

  const { error: uErr } = await supabase
    .from('stories')
    .update({ highlight_id: highlightId, is_archived: true })
    .eq('id', story.id);

  if (uErr) return { error: '스토리 저장 실패' };

  revalidatePath('/');
  return { data: { highlightId } };
}

export async function deleteStory(storyId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { error } = await supabase.from('stories').delete().eq('id', storyId);
  if (error) return { error: '스토리 삭제 실패' };

  revalidatePath('/');
  return { ok: true };
}
