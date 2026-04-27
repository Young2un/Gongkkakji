import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostForm } from '@/components/board/post-form';

export default async function EditPostPage({
  params,
}: {
  params: { slug: string; postId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/c/${params.slug}/${params.postId}/edit`);
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, content, media_urls, author_id, category:categories(slug, name)')
    .eq('id', params.postId)
    .maybeSingle();

  if (!post) notFound();

  const category = Array.isArray(post.category) ? post.category[0] : post.category;
  if (category?.slug !== params.slug) notFound();

  // 권한 체크
  let canEdit = post.author_id === user.id;
  if (!canEdit) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    canEdit = profile?.role === 'admin';
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <h1 className="text-xl font-bold">수정 권한이 없어요</h1>
        <p className="text-sm text-muted-foreground">
          작성자 본인 또는 관리자만 글을 수정할 수 있습니다.
        </p>
        <Link
          href={`/c/${category.slug}/${post.id}`}
          className="inline-block text-sm text-accent underline"
        >
          게시글로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <Link href={`/c/${category.slug}`} className="hover:underline">
            {category.name}
          </Link>
        </p>
        <h1 className="text-2xl font-bold tracking-tight">글 수정</h1>
      </header>

      <PostForm
        categorySlug={category.slug}
        userId={user.id}
        postId={post.id}
        initialData={{
          title: post.title,
          content: post.content,
          mediaUrls: post.media_urls || [],
        }}
      />
    </div>
  );
}
