'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const postSchema = z.object({
  categorySlug: z.string().min(1),
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요'),
  mediaUrls: z.array(z.string().url()).max(10).default([]),
});

export async function createPost(input: {
  categorySlug: string;
  title: string;
  content: string;
  mediaUrls: string[];
}) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('slug', parsed.data.categorySlug)
    .maybeSingle();
  if (!category) return { error: '카테고리를 찾을 수 없습니다' };

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      category_id: category.id,
      author_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      media_urls: parsed.data.mediaUrls,
    })
    .select('id')
    .single();

  if (error) {
    return { error: '작성 권한이 없거나 오류가 발생했어요' };
  }

  revalidatePath(`/c/${category.slug}`);
  revalidatePath('/');
  redirect(`/c/${category.slug}/${post.id}`);
}

export async function updatePost(input: {
  postId: string;
  categorySlug: string;
  title: string;
  content: string;
  mediaUrls: string[];
}) {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  // 작성자 확인 (RLS로도 보호되지만 명시적 확인)
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', input.postId)
    .maybeSingle();

  if (!post || post.author_id !== user.id) {
    // admin인지 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.role !== 'admin') {
      return { error: '수정 권한이 없습니다' };
    }
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      media_urls: parsed.data.mediaUrls,
    })
    .eq('id', input.postId);

  if (error) {
    return { error: '수정 중 오류가 발생했어요' };
  }

  revalidatePath(`/c/${input.categorySlug}/${input.postId}`);
  revalidatePath(`/c/${input.categorySlug}`);
  revalidatePath('/');
  redirect(`/c/${input.categorySlug}/${input.postId}`);
}

export async function deletePost(input: {
  postId: string;
  categorySlug: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', input.postId)
    .maybeSingle();

  if (!post || post.author_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.role !== 'admin') {
      return { error: '삭제 권한이 없습니다' };
    }
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', input.postId);

  if (error) {
    return { error: '삭제 중 오류가 발생했어요' };
  }

  revalidatePath(`/c/${input.categorySlug}`);
  revalidatePath('/');
  redirect(`/c/${input.categorySlug}`);
}

export async function createComment(input: {
  postId: string;
  content: string;
  parentId?: string | null;
  categorySlug: string;
}) {
  const content = input.content.trim();
  if (!content) return { error: '댓글 내용을 입력해주세요' };
  if (content.length > 1000) return { error: '댓글은 1000자 이하로 작성해주세요' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: input.postId,
      author_id: user.id,
      parent_id: input.parentId ?? null,
      content,
    })
    .select(
      'id, content, parent_id, created_at, author:profiles(id, username, display_name, avatar_url, role)'
    )
    .single();

  if (error || !data) {
    return { error: '댓글 작성에 실패했어요' };
  }

  revalidatePath(`/c/${input.categorySlug}/${input.postId}`);
  return { data };
}

export async function toggleLike(input: {
  targetType: 'post' | 'comment';
  targetId: string;
  revalidate?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('target_type', input.targetType)
    .eq('target_id', input.targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', input.targetType)
      .eq('target_id', input.targetId);
    if (error) return { error: '좋아요 취소 실패' };
    if (input.revalidate) revalidatePath(input.revalidate);
    return { liked: false };
  } else {
    const { error } = await supabase.from('likes').insert({
      user_id: user.id,
      target_type: input.targetType,
      target_id: input.targetId,
    });
    if (error) return { error: '좋아요 실패' };
    if (input.revalidate) revalidatePath(input.revalidate);
    return { liked: true };
  }
}

// view_count 증가: RLS로 인해 본인 글만 update 가능하므로 admin 클라이언트 사용
export async function incrementView(postId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('posts')
    .select('view_count')
    .eq('id', postId)
    .maybeSingle();
  if (!data) return { ok: false };

  await admin
    .from('posts')
    .update({ view_count: data.view_count + 1 })
    .eq('id', postId);

  return { ok: true };
}
