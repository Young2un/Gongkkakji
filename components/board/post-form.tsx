'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPost, updatePost } from '@/app/actions/board';
import { Button } from '@/components/ui/button';

interface PostFormProps {
  categorySlug: string;
  userId: string;
  postId?: string;
  initialData?: {
    title: string;
    content: string;
    mediaUrls: string[];
  };
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = 'image/png, image/jpeg, image/webp, image/gif';

export function PostForm({ categorySlug, userId, postId, initialData }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialData?.mediaUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('이미지 파일만 업로드할 수 있어요');
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError('이미지는 5MB 이하만 업로드할 수 있어요');
          continue;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('posts')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) {
          setError(`업로드 실패: ${upErr.message}`);
          continue;
        }
        const { data } = supabase.storage.from('posts').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length > 0) setMediaUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (url: string) => {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요');
      return;
    }
    startTransition(async () => {
      let res;
      if (postId) {
        res = await updatePost({
          postId,
          categorySlug,
          title: title.trim(),
          content: content.trim(),
          mediaUrls,
        });
      } else {
        res = await createPost({
          categorySlug,
          title: title.trim(),
          content: content.trim(),
          mediaUrls,
        });
      }
      // 성공 시 redirect 되므로 아래는 실패 케이스만
      if (res && 'error' in res && res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="post-title">
          제목
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="제목을 입력하세요"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="post-content">
          내용
        </label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="내용을 입력하세요"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || mediaUrls.length >= 10}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            이미지 추가
          </Button>
          <span className="text-xs text-muted-foreground">
            최대 10장 · 장당 5MB
          </span>
        </div>

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {mediaUrls.map((url) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-md border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 rounded-full bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="이미지 제거"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-live/50 bg-live/10 p-3 text-sm text-live">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          취소
        </Button>
        <Button type="submit" disabled={isPending || uploading}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {postId ? '수정하기' : '작성하기'}
        </Button>
      </div>
    </form>
  );
}
