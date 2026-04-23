'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createStory } from '@/app/actions/story';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPT = 'image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm';

interface StoryUploaderProps {
  userId: string;
  trigger?: 'icon' | 'plus-avatar';
  avatarUrl?: string | null;
}

export function StoryUploader({
  userId,
  trigger = 'icon',
  avatarUrl,
}: StoryUploaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="스토리 올리기"
          title="스토리 올리기"
        >
          <Plus className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-16 flex-col items-center gap-1.5"
          aria-label="내 스토리 올리기"
        >
          <div className="relative h-16 w-16 rounded-full border border-dashed border-border p-0.5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-muted" />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-accent text-white">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground">내 스토리</span>
        </button>
      )}

      {open && <UploaderModal userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}

function UploaderModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !uploading && !isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, uploading, isPending]);

  const handleFile = (f: File) => {
    setError(null);
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('이미지 또는 비디오만 업로드할 수 있어요');
      return;
    }
    if (isImage && f.size > MAX_IMAGE_SIZE) {
      setError('이미지는 10MB 이하만 가능해요');
      return;
    }
    if (isVideo && f.size > MAX_VIDEO_SIZE) {
      setError('비디오는 50MB 이하만 가능해요');
      return;
    }
    setFile(f);
    setMediaType(isImage ? 'image' : 'video');
  };

  const handleSubmit = async () => {
    if (!file || !mediaType) return;
    setError(null);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('stories')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) {
        setError(`업로드 실패: ${upErr.message}`);
        setUploading(false);
        return;
      }

      const { data: pub } = supabase.storage.from('stories').getPublicUrl(path);

      startTransition(async () => {
        const res = await createStory({
          mediaUrl: pub.publicUrl,
          mediaType,
          caption,
        });
        if ('error' in res && res.error) {
          setError(res.error);
          setUploading(false);
        } else {
          setUploading(false);
          onClose();
          router.refresh();
        }
      });
    } catch (e) {
      setError('알 수 없는 오류가 발생했어요');
      setUploading(false);
    }
  };

  const busy = uploading || isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">스토리 올리기</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md p-1 hover:bg-muted disabled:opacity-50"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {!file ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border hover:bg-muted/50"
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              이미지 또는 비디오 선택
            </div>
            <div className="text-xs text-muted-foreground">
              이미지 10MB · 비디오 50MB 이하
            </div>
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            {mediaType === 'image' && preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="mx-auto max-h-[60vh] w-auto object-contain"
              />
            )}
            {mediaType === 'video' && preview && (
              <video
                src={preview}
                controls
                className="mx-auto max-h-[60vh] w-auto"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setMediaType(null);
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={busy}
              className={cn(
                'absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-background hover:bg-foreground',
                busy && 'opacity-50'
              )}
              aria-label="미디어 제거"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="캡션을 입력하세요 (선택)"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
        />

        {error && (
          <div className="rounded-md border border-live/50 bg-live/10 p-3 text-sm text-live">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!file || busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            올리기
          </Button>
        </div>
      </div>
    </div>
  );
}
