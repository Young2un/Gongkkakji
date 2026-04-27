import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';
import { AuthorBadge } from '@/components/board/author-badge';
import { LikeButton } from '@/components/board/like-button';
import {
  CommentSection,
  type CommentItem,
} from '@/components/board/comment-section';
import { ViewCounter } from '@/components/board/view-counter';
import { PostActions } from '@/components/board/post-actions';

export default async function PostDetailPage({
  params,
}: {
  params: { slug: string; postId: string };
}) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from('posts')
    .select(
      'id, title, content, media_urls, view_count, created_at, author_id, category:categories(slug, name), author:profiles(id, username, display_name, avatar_url, role)'
    )
    .eq('id', params.postId)
    .maybeSingle();

  if (!post) notFound();

  const category = Array.isArray(post.category) ? post.category[0] : post.category;
  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  // URL의 slug와 실제 카테고리 slug 불일치 시 notFound
  if (category?.slug !== params.slug) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserProfile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();
    currentUserProfile = data;
  }

  const [commentsRes, likeCountRes, userLikeRes] = await Promise.all([
    supabase
      .from('comments')
      .select(
        'id, content, parent_id, created_at, author:profiles(id, username, display_name, avatar_url, role)'
      )
      .eq('post_id', post.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('likes')
      .select('user_id', { count: 'exact', head: true })
      .eq('target_type', 'post')
      .eq('target_id', post.id),
    user
      ? supabase
          .from('likes')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .eq('target_id', post.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const commentRows = commentsRes.data;
  const likeCount = likeCountRes.count ?? 0;
  const initialLiked = !!userLikeRes.data;

  const comments: CommentItem[] = (commentRows ?? []).map((c) => {
    const a = Array.isArray(c.author) ? c.author[0] : c.author;
    return {
      id: c.id,
      content: c.content,
      parent_id: c.parent_id,
      created_at: c.created_at,
      author: a
        ? {
            id: a.id,
            username: a.username,
            display_name: a.display_name,
            avatar_url: a.avatar_url,
            role: a.role,
          }
        : null,
    };
  });

  const canEdit =
    currentUserProfile &&
    (currentUserProfile.id === post.author_id || currentUserProfile.role === 'admin');

  return (
    <article className="space-y-8">
      <ViewCounter postId={post.id} />

      <Link
        href={`/c/${category.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {category.name}
      </Link>

      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight break-words flex-1">
            {post.title}
          </h1>
          {canEdit && (
            <PostActions postId={post.id} categorySlug={category.slug} />
          )}
        </div>
        <div className="flex items-center justify-between">
          <AuthorBadge author={author} size="md" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{timeAgo(post.created_at)}</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.view_count}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <div className="whitespace-pre-wrap break-words text-[15px] leading-7">
          {post.content}
        </div>

        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid gap-3">
            {post.media_urls.map((url: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="w-full rounded-lg border border-border"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-y border-border py-4">
        <LikeButton
          targetType="post"
          targetId={post.id}
          initialLiked={initialLiked}
          initialCount={likeCount}
          isLoggedIn={!!user}
          revalidate={`/c/${category.slug}/${post.id}`}
        />
      </div>

      <CommentSection
        postId={post.id}
        categorySlug={category.slug}
        comments={comments}
        currentUser={currentUserProfile}
      />
    </article>
  );
}
