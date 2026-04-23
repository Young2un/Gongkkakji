import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

export default async function HomePage() {
  const supabase = createClient();

  // 최근 게시글 10개
  const { data: posts } = await supabase
    .from('posts')
    .select(
      'id, title, created_at, category:categories(slug, name), author:profiles(display_name, username, avatar_url, role)'
    )
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">최근 글</h1>
        <p className="text-sm text-muted-foreground">
          팬들의 이야기와 스트리머 공지를 모아봤어요
        </p>
      </section>

      {posts && posts.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {posts.map((post) => {
            const category = Array.isArray(post.category)
              ? post.category[0]
              : post.category;
            const author = Array.isArray(post.author)
              ? post.author[0]
              : post.author;
            return (
              <li key={post.id}>
                <Link
                  href={`/c/${category?.slug}/${post.id}`}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">
                        {category?.name}
                      </span>
                      <span>{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {author?.display_name ?? author?.username}
                      {author?.role === 'streamer' && (
                        <span className="ml-1 text-accent">· 스트리머</span>
                      )}
                    </p>
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
    </div>
  );
}
