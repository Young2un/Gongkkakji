import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle, PencilLine, Pin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/board/pagination';

const PAGE_SIZE = 10;

export default async function CategoryListPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const supabase = createClient();

  const pageParam = parseInt(searchParams.page ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, name, description, streamer_only')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) notFound();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: posts, count } = await supabase
    .from('posts')
    .select(
      'id, title, view_count, is_pinned, created_at, author:profiles(username, display_name, role)',
      { count: 'exact' }
    )
    .eq('category_id', category.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // 각 게시글의 댓글 수 (간단하게 개별 count 쿼리, 10개라 부담 적음)
  const postIds = (posts ?? []).map((p) => p.id);
  const commentCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: commentRows } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);
    for (const row of commentRows ?? []) {
      commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {category.name}
            </h1>
            {category.streamer_only && (
              <span className="rounded bg-accent px-2 py-0.5 text-xs text-white">
                STREAMER ONLY
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
        <Link href={`/c/${category.slug}/new`}>
          <Button size="sm">
            <PencilLine className="h-4 w-4" />
            글쓰기
          </Button>
        </Link>
      </header>

      {posts && posts.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {posts.map((post) => {
            const author = Array.isArray(post.author)
              ? post.author[0]
              : post.author;
            return (
              <li key={post.id}>
                <Link
                  href={`/c/${category.slug}/${post.id}`}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/50"
                >
                  {post.is_pinned && (
                    <Pin className="mt-1 h-4 w-4 shrink-0 text-accent" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{post.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {author?.display_name ?? author?.username}
                        {author?.role === 'streamer' && (
                          <span className="ml-1 text-accent">· 스트리머</span>
                        )}
                      </span>
                      <span>{timeAgo(post.created_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {commentCounts[post.id] ?? 0}
                      </span>
                      <span>조회 {post.view_count}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            아직 게시글이 없어요. 첫 글을 작성해보세요!
          </p>
        </div>
      )}

      <Pagination
        basePath={`/c/${category.slug}`}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
