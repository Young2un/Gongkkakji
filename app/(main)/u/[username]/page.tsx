import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, Pencil, User, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getChannelInfo } from '@/lib/chzzk/channel';
import { formatCount, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const RECENT_POST_LIMIT = 10;

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username);
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, role, chzzk_channel_id, created_at')
    .eq('username', username)
    .maybeSingle();

  if (!profile) notFound();

  const isStreamer = profile.role === 'streamer';

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMe = user?.id === profile.id;

  // 치지직 채널 정보 (스트리머 + 채널 ID 있을 때만)
  const channelInfo =
    isStreamer && profile.chzzk_channel_id
      ? await getChannelInfo(profile.chzzk_channel_id)
      : null;

  // 최근 글 + 하이라이트 (스트리머만) 병렬 조회
  const [postsRes, highlightsRes] = await Promise.all([
    supabase
      .from('posts')
      .select(
        'id, title, created_at, category:categories(slug, name)'
      )
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(RECENT_POST_LIMIT),
    isStreamer
      ? supabase
          .from('highlights')
          .select('id, title, cover_url, sort_order, created_at')
          .eq('owner_id', profile.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const posts = postsRes.data ?? [];
  const highlights = highlightsRes.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* 프로필 헤더 */}
      <header className="flex items-start gap-5">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">
              {profile.display_name ?? profile.username}
            </h1>
            {isStreamer && (
              <span className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-white">
                STREAMER
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="whitespace-pre-wrap break-words text-sm">
              {profile.bio}
            </p>
          )}

          {channelInfo && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
              {typeof channelInfo.followerCount === 'number' && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {formatCount(channelInfo.followerCount)}
                  </span>
                  팔로워
                </span>
              )}
              <a
                href={`https://chzzk.naver.com/${profile.chzzk_channel_id}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                치지직 채널
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {isMe && (
            <div className="pt-2">
              <Link href="/profile">
                <Button size="sm" variant="outline">
                  <Pencil className="h-4 w-4" />
                  프로필 수정
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 하이라이트 (스트리머) */}
      {isStreamer && highlights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">하이라이트</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {highlights.map((h) => (
              <div
                key={h.id}
                className="flex w-20 shrink-0 flex-col items-center gap-1.5"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full border border-border">
                  {h.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <span className="w-full truncate text-center text-xs">
                  {h.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 최근 글 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">최근 글</h2>
        {posts.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {posts.map((post) => {
              const category = Array.isArray(post.category)
                ? post.category[0]
                : post.category;
              return (
                <li key={post.id}>
                  <Link
                    href={`/c/${category?.slug}/${post.id}`}
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {category?.name}
                        </span>
                        <span className="ml-2">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="font-medium">{post.title}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            아직 작성한 글이 없어요
          </div>
        )}
      </section>
    </div>
  );
}
