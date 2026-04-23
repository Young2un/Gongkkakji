import Link from 'next/link';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { StoryUploader } from './story-uploader';

interface AuthorGroup {
  author_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  firstStoryId: string;
  storyIds: string[];
  hasUnread: boolean;
  latestAt: string;
}

export async function StoryBar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 활성 스토리 전체 (24시간 내, 미아카이브)
  const { data: stories } = await supabase
    .from('active_stories')
    .select('id, author_id, created_at')
    .order('created_at', { ascending: false });

  if (!stories || stories.length === 0) {
    // 비어있는 경우에도 "내 스토리 추가" 항목은 로그인 유저에게 노출
    if (!user) return null;
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    return (
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 py-4">
          <div className="flex gap-4">
            <StoryUploader
              userId={user.id}
              trigger="plus-avatar"
              avatarUrl={myProfile?.avatar_url}
            />
          </div>
        </div>
      </div>
    );
  }

  const authorIds = Array.from(new Set(stories.map((s) => s.author_id)));
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, role')
    .in('id', authorIds);

  // 본인의 조회 기록
  let viewedIds = new Set<string>();
  if (user) {
    const storyIdList = stories.map((s) => s.id);
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', user.id)
      .in('story_id', storyIdList);
    viewedIds = new Set((views ?? []).map((v) => v.story_id));
  }

  // 작성자별 그룹핑
  const groupsMap = new Map<string, AuthorGroup>();
  for (const s of stories) {
    const author = authors?.find((a) => a.id === s.author_id);
    if (!author) continue;
    const existing = groupsMap.get(s.author_id);
    const isUnread = user ? !viewedIds.has(s.id) : true;
    if (existing) {
      existing.storyIds.push(s.id);
      existing.hasUnread = existing.hasUnread || isUnread;
    } else {
      groupsMap.set(s.author_id, {
        author_id: author.id,
        username: author.username,
        display_name: author.display_name,
        avatar_url: author.avatar_url,
        role: author.role,
        firstStoryId: s.id,
        storyIds: [s.id],
        hasUnread: isUnread,
        latestAt: s.created_at,
      });
    }
  }

  const groups = Array.from(groupsMap.values());
  // 스트리머 먼저 → 이후 최신순
  groups.sort((a, b) => {
    const aStreamer = a.role === 'streamer' ? 0 : 1;
    const bStreamer = b.role === 'streamer' ? 0 : 1;
    if (aStreamer !== bStreamer) return aStreamer - bStreamer;
    return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
  });

  // 본인 프로필 (업로드 트리거용)
  let myAvatar: string | null | undefined = undefined;
  if (user) {
    const me = authors?.find((a) => a.id === user.id);
    myAvatar = me?.avatar_url;
    if (myAvatar === undefined) {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      myAvatar = data?.avatar_url;
    }
  }

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl overflow-x-auto px-4 py-4">
        <div className="flex gap-4">
          {user && (
            <StoryUploader
              userId={user.id}
              trigger="plus-avatar"
              avatarUrl={myAvatar ?? null}
            />
          )}
          {groups.map((g) => (
            <StoryBarItem key={g.author_id} group={g} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StoryBarItem({ group }: { group: AuthorGroup }) {
  const ringClass = group.hasUnread
    ? 'bg-gradient-to-tr from-accent via-accent to-live'
    : 'bg-muted';

  return (
    <Link
      href={`/story/${group.firstStoryId}`}
      className="flex w-16 shrink-0 flex-col items-center gap-1.5"
    >
      <span className={cn('rounded-full p-0.5', ringClass)}>
        <span className="block rounded-full border-2 border-background">
          {group.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          'w-full truncate text-center text-xs',
          group.role === 'streamer' && 'font-medium text-accent'
        )}
      >
        {group.display_name ?? group.username}
      </span>
    </Link>
  );
}
