import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostForm } from '@/components/board/post-form';

export default async function NewPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/c/${params.slug}/new`);
  }

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, name, streamer_only')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) notFound();

  // streamer_only 카테고리는 role 체크
  if (category.streamer_only) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isStreamerOrAdmin =
      profile?.role === 'streamer' || profile?.role === 'admin';

    if (!isStreamerOrAdmin) {
      return (
        <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
          <h1 className="text-xl font-bold">작성 권한이 없어요</h1>
          <p className="text-sm text-muted-foreground">
            &quot;{category.name}&quot; 게시판은 스트리머만 글을 쓸 수 있어요.
          </p>
          <Link
            href={`/c/${category.slug}`}
            className="inline-block text-sm text-accent underline"
          >
            게시판으로 돌아가기
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <Link href={`/c/${category.slug}`} className="hover:underline">
            {category.name}
          </Link>
        </p>
        <h1 className="text-2xl font-bold tracking-tight">새 글 작성</h1>
      </header>

      <PostForm categorySlug={category.slug} userId={user.id} />
    </div>
  );
}
