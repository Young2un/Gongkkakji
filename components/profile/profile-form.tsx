'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Upload, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';

interface Props {
  userId: string;
  initial: {
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
}

const MAX_AVATAR = 2 * 1024 * 1024; // 2MB
const ACCEPT = 'image/png, image/jpeg, image/webp';

export function ProfileForm({ userId, initial }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name ?? '');
  const [bio, setBio] = useState(initial.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleAvatar = async (file: File) => {
    setError(null);
    if (file.size > MAX_AVATAR) {
      setError('아바타는 2MB 이하만 업로드할 수 있어요');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('posts')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) {
        setError(`업로드 실패: ${upErr.message}`);
        return;
      }
      const { data } = supabase.storage.from('posts').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      if ('error' in res && res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatar(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            아바타 변경
          </Button>
          <p className="text-xs text-muted-foreground">PNG/JPG · 2MB 이하</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="username">
          아이디
        </label>
        <input
          id="username"
          type="text"
          value={initial.username}
          readOnly
          className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="display_name">
          표시 이름
        </label>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          placeholder="다른 사람에게 보여질 이름"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="bio">
          소개
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="자신을 소개해보세요 (최대 200자)"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
        />
        <p className="text-right text-xs text-muted-foreground">
          {bio.length}/200
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-live/50 bg-live/10 p-3 text-sm text-live">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        {saved && (
          <p className="inline-flex items-center gap-1 text-sm text-accent">
            <Check className="h-4 w-4" />
            저장되었어요
          </p>
        )}
        <Button
          type="submit"
          disabled={isPending || uploading}
          className="ml-auto"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          저장
        </Button>
      </div>
    </form>
  );
}
