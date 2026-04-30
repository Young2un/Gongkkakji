import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StoryViewer, type StoryViewerItem } from '@/components/story/story-viewer';

export const dynamic = 'force-dynamic';

export default async function StoryPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // 해당 스토리 (조인 없이 — 조인 실패로 row가 통째로 null로 오는 것 방지)
  const { data: story, error: storyErr } = await supabase
    .from('stories')
    .select('id, author_id, expires_at, is_archived')
    .eq('id', params.id)
    .maybeSingle();

  if (storyErr) {
    console.error('[story-page] stories select error', { id: params.id, storyErr });
  }
  if (!story) {
    console.error('[story-page] story not found / blocked by RLS', { id: params.id });
    notFound();
  }

  // 만료/아카이브된 스토리는 본인만 열람 가능
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isExpired =
    new Date(story.expires_at).getTime() < Date.now() || story.is_archived;
  const isOwner = !!user && user.id === story.author_id;
  if (isExpired && !isOwner) notFound();

  // 작성자 프로필
  const { data: author, error: authorErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, role')
    .eq('id', story.author_id)
    .maybeSingle();

  if (authorErr) {
    console.error('[story-page] profiles select error', { authorId: story.author_id, authorErr });
  }
  if (!author) {
    console.error('[story-page] author profile missing', { authorId: story.author_id });
    notFound();
  }

  // 같은 작성자의 활성 스토리 전체
  const { data: rows } = await supabase
    .from('active_stories')
    .select('id, media_url, media_type, caption, created_at')
    .eq('author_id', story.author_id)
    .order('created_at', { ascending: true });

  // 본인이면 아카이브/만료 포함해서도 현재 스토리는 보여줘야 하므로 보정
  let list = rows ?? [];
  if (list.length === 0) {
    // 만료된 본인 스토리 단독 뷰
    const { data: single } = await supabase
      .from('stories')
      .select('id, media_url, media_type, caption, created_at')
      .eq('id', story.id)
      .maybeSingle();
    if (single) list = [single];
  }

  // 각 스토리의 조회수 (본인만 의미 있음)
  const storyIds = list.map((s) => s.id);
  const viewCountMap: Record<string, number> = {};
  if (isOwner && storyIds.length > 0) {
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .in('story_id', storyIds);
    for (const v of views ?? []) {
      viewCountMap[v.story_id] = (viewCountMap[v.story_id] ?? 0) + 1;
    }
  }

  const stories: StoryViewerItem[] = list.map((s) => ({
    id: s.id,
    media_url: s.media_url,
    media_type: (s.media_type as 'image' | 'video') ?? 'image',
    caption: s.caption,
    created_at: s.created_at,
    view_count: viewCountMap[s.id] ?? 0,
  }));

  const startIndex = Math.max(
    0,
    stories.findIndex((s) => s.id === story.id)
  );

  // 스트리머면 기존 하이라이트 목록 조회 (저장 모달에서 선택용)
  const isStreamer = author.role === 'streamer' || author.role === 'admin';
  let existingHighlights: { id: string; title: string; cover_url: string | null }[] = [];
  if (isOwner && isStreamer) {
    const { data } = await supabase
      .from('highlights')
      .select('id, title, cover_url')
      .eq('owner_id', author.id)
      .order('created_at', { ascending: false });
    existingHighlights = data ?? [];
  }

  return (
    <StoryViewer
      author={{
        id: author.id,
        username: author.username,
        display_name: author.display_name,
        avatar_url: author.avatar_url,
        role: author.role,
      }}
      stories={stories}
      startIndex={startIndex}
      isOwner={isOwner}
      isStreamer={isStreamer}
      existingHighlights={existingHighlights}
    />
  );
}
