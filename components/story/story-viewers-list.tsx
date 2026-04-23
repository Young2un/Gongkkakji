'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2, User, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';

interface Viewer {
  viewer_id: string;
  viewed_at: string;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

interface Props {
  storyId: string;
  onClose: () => void;
}

export function StoryViewersList({ storyId, onClose }: Props) {
  const [viewers, setViewers] = useState<Viewer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from('story_views')
        .select(
          'viewer_id, viewed_at, profile:profiles(username, display_name, avatar_url, role)'
        )
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) {
        setError('조회자 목록을 불러오지 못했어요');
        return;
      }
      const normalized: Viewer[] = (data ?? []).map((v) => ({
        viewer_id: v.viewer_id,
        viewed_at: v.viewed_at,
        profile: Array.isArray(v.profile) ? v.profile[0] ?? null : v.profile,
      }));
      setViewers(normalized);
    })();
  }, [storyId]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-t-xl border border-border bg-background p-6 shadow-lg sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Eye className="h-5 w-5" />
            조회자 {viewers?.length ?? 0}명
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {viewers === null && !error ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-live">{error}</p>
          ) : viewers && viewers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              아직 조회한 사람이 없어요
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {viewers?.map((v) => (
                <li key={v.viewer_id} className="flex items-center gap-3 py-2.5">
                  {v.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.profile.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                  <div className="flex-1 text-sm">
                    <div className="font-medium">
                      {v.profile?.display_name ?? v.profile?.username}
                      {v.profile?.role === 'streamer' && (
                        <span className="ml-1 text-xs text-accent">· 스트리머</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {timeAgo(v.viewed_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
