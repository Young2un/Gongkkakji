'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bookmark, Eye, Trash2, X } from 'lucide-react';
import { markStoryViewed, deleteStory } from '@/app/actions/story';
import { timeAgo } from '@/lib/utils';
import {
  HighlightSaveModal,
  type ExistingHighlight,
} from './highlight-save-modal';
import { StoryViewersList } from './story-viewers-list';

const Stories = dynamic(() => import('react-insta-stories'), { ssr: false });

export interface StoryViewerItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  created_at: string;
  view_count: number;
}

export interface StoryAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface Props {
  author: StoryAuthor;
  stories: StoryViewerItem[];
  startIndex: number;
  isOwner: boolean;
  isStreamer: boolean;
  existingHighlights: ExistingHighlight[];
}

export function StoryViewer({
  author,
  stories,
  startIndex,
  isOwner,
  isStreamer,
  existingHighlights,
}: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);

  const currentStory = stories[currentIndex];

  const items = useMemo(
    () =>
      stories.map((s) => ({
        url: s.media_url,
        type: s.media_type === 'video' ? ('video' as const) : undefined,
        duration: 5000,
      })),
    [stories]
  );

  const handleClose = () => {
    router.back();
  };

  const handleStoryStart = (id: number) => {
    const story = stories[id];
    if (!story) return;
    setCurrentIndex(id);
    if (!isOwner) {
      markStoryViewed(story.id).catch(() => {});
    }
  };

  const handleAllEnd = () => {
    router.back();
  };

  const handleDelete = async () => {
    if (!confirm('이 스토리를 삭제할까요?')) return;
    const res = await deleteStory(currentStory.id);
    if ('error' in res && res.error) {
      alert(res.error);
      return;
    }
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* 상단 작성자 정보 & 컨트롤 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-2 text-white">
            {author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full border border-white/40 object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-white/20" />
            )}
            <div className="text-sm">
              <div className="font-medium">
                {author.display_name ?? author.username}
                {author.role === 'streamer' && (
                  <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                    STREAMER
                  </span>
                )}
              </div>
              <div className="text-xs text-white/70">
                {timeAgo(currentStory.created_at)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="pointer-events-auto rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 스토리 콘텐츠 */}
      <div className="relative h-full max-h-[100dvh] w-full max-w-md bg-black">
        <Stories
          stories={items}
          defaultInterval={5000}
          width="100%"
          height="100%"
          currentIndex={startIndex}
          keyboardNavigation
          onStoryStart={handleStoryStart}
          onAllStoriesEnd={handleAllEnd}
          storyContainerStyles={{
            borderRadius: 0,
            background: '#000',
          }}
        />
      </div>

      {/* 캡션 */}
      {currentStory.caption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 px-6 text-center">
          <p className="inline-block rounded-md bg-black/50 px-3 py-1.5 text-sm text-white">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* 하단 컨트롤 (본인만) */}
      {isOwner && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <button
              type="button"
              onClick={() => setViewersOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            >
              <Eye className="h-4 w-4" />
              조회자 {currentStory.view_count}
            </button>
            <div className="flex items-center gap-2">
              {isStreamer && (
                <button
                  type="button"
                  onClick={() => setHighlightOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                >
                  <Bookmark className="h-4 w-4" />
                  하이라이트 저장
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-live/40"
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {highlightOpen && (
        <HighlightSaveModal
          storyId={currentStory.id}
          existingHighlights={existingHighlights}
          onClose={() => setHighlightOpen(false)}
          onSaved={() => {
            setHighlightOpen(false);
            router.back();
          }}
        />
      )}

      {viewersOpen && (
        <StoryViewersList
          storyId={currentStory.id}
          onClose={() => setViewersOpen(false)}
        />
      )}
    </div>
  );
}
