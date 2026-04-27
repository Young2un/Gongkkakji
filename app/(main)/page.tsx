import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';
import { Play, MessageSquare, Video, ArrowRight, Star, ExternalLink, Megaphone } from 'lucide-react';
import { getStreamerLive } from '@/lib/chzzk';

export default async function HomePage() {
  const supabase = createClient();
  const live = await getStreamerLive();

  // 최신 공지사항 1개
  const { data: notices } = await supabase
    .from('posts')
    .select('id, title, created_at, category:categories!inner(slug)')
    .eq('categories.slug', 'notice')
    .order('created_at', { ascending: false })
    .limit(1);
  const latestNotice = notices?.[0];

  // 최신 클립 2개
  const { data: clips } = await supabase
    .from('posts')
    .select('id, title, created_at, media_urls, author:profiles(display_name, username, avatar_url), category:categories!inner(slug)')
    .eq('categories.slug', 'clips')
    .order('created_at', { ascending: false })
    .limit(2);

  // 최근 자유게시판 글 4개
  const { data: freePosts } = await supabase
    .from('posts')
    .select('id, title, created_at, author:profiles(display_name, username, avatar_url), category:categories!inner(slug)')
    .eq('categories.slug', 'free')
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="space-y-6">
      {/* 1. 크리에이티브 히어로 섹션 */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-card/40 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        {/* 배경 애니메이션 효과 */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-black/40 opacity-50 mix-blend-overlay" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-6 text-center md:text-left">
            {live ? (
              <div className="inline-flex items-center rounded-full border border-live/20 bg-live/10 px-3 py-1 text-xs font-bold text-live">
                <span className="mr-2 flex h-2 w-2 rounded-full bg-live animate-ping"></span>
                ON AIR : 현재 방송 중!
              </div>
            ) : (
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-muted-foreground">
                <span className="mr-2 flex h-2 w-2 rounded-full bg-white/20"></span>
                OFF AIR : 다음 방송에서 만나요
              </div>
            )}
            
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter">
              <span className="block text-white/90 mb-2">스트리머 김공은</span>
              <span className="text-primary pr-2">공식 팬카페</span>
            </h1>
            
            <p className="text-muted-foreground text-lg max-w-lg mx-auto md:mx-0 leading-relaxed">
              방송 시간은 유동적! 주로 퇴근 후 방송을 켭니다.<br/>
              다양한 게임과 소통으로 즐거운 시간을 함께해요.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <a 
                href={process.env.STREAMER_CHANNEL_ID ? `https://chzzk.naver.com/${live ? 'live/' : ''}${process.env.STREAMER_CHANNEL_ID}` : "https://chzzk.naver.com"} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-primary/90"
              >
                <Play className="h-4 w-4 fill-current" />
                {live ? '방송 보러가기' : '채널 구경하기'}
              </a>
              <Link 
                href="/c/free"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/40"
              >
                <MessageSquare className="h-4 w-4" />
                자유게시판 구경하기
              </Link>
            </div>
          </div>

          {/* 우측 장식 요소 (3D 느낌의 카드 또는 아바타 플레이스홀더) */}
          <div className="hidden md:block relative w-64 h-64 shrink-0 perspective-1000">
            <div className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-tr from-primary/10 to-secondary/10 backdrop-blur-md transform rotate-y-12 rotate-x-12 shadow-2xl transition-transform duration-500 hover:rotate-y-0 hover:rotate-x-0 flex items-center justify-center group cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 mix-blend-overlay" />
              <div className="z-20 text-center flex flex-col items-center justify-center p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/images/logo.png" 
                  alt="공깍지 로고" 
                  className="w-full h-auto object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 벤토 박스 (Bento Box) 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 공지사항 (Span 2) */}
        <div className="md:col-span-2 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between group hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Megaphone className="h-5 w-5" />
              <h2>최신 공지사항</h2>
            </div>
            <Link href="/c/notice" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
              더보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {latestNotice ? (
            <Link href={`/c/notice/${latestNotice.id}`} className="block mt-auto">
              <div className="rounded-xl bg-white/5 p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{latestNotice.title}</h3>
                <p className="text-sm text-muted-foreground">{timeAgo(latestNotice.created_at)}</p>
              </div>
            </Link>
          ) : (
            <div className="mt-auto rounded-xl bg-white/5 p-4 text-center text-sm text-muted-foreground border border-white/5">
              등록된 공지사항이 없습니다.
            </div>
          )}
        </div>

        {/* 소셜 링크 (Span 1) */}
        <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-6 flex flex-col justify-center items-center gap-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Social Links</h2>
          <div className="flex gap-3 w-full justify-center">
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00FFA3]/10 text-[#00FFA3] hover:bg-[#00FFA3]/20 hover:scale-110 transition-all border border-[#00FFA3]/20" title="치지직">
              <span className="font-black text-lg">C</span>
            </a>
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 hover:scale-110 transition-all border border-[#FF0000]/20" title="유튜브">
              <Play className="h-5 w-5 fill-current" />
            </a>
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 hover:scale-110 transition-all border border-[#E1306C]/20" title="인스타그램">
              <div className="h-5 w-5 rounded-md border-2 border-current flex items-center justify-center relative">
                <div className="h-2 w-2 rounded-full border-2 border-current"></div>
                <div className="absolute top-0.5 right-0.5 h-0.5 w-0.5 bg-current rounded-full"></div>
              </div>
            </a>
          </div>
        </div>

        {/* 최근 클립 (Span 1) */}
        <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-accent font-bold">
              <Video className="h-5 w-5" />
              <h2>인기 클립</h2>
            </div>
            <Link href="/c/clips" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
              더보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {clips && clips.length > 0 ? (
              clips.map((clip) => (
                <Link key={clip.id} href={`/c/clips/${clip.id}`} className="group relative flex-1 rounded-xl overflow-hidden bg-black/50 border border-white/5">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors z-10">
                    <Play className="h-8 w-8 text-white opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-20">
                    <p className="text-sm font-bold text-white line-clamp-1">{clip.title}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-sm text-muted-foreground">
                아직 클립이 없어요.
              </div>
            )}
          </div>
        </div>

        {/* 최근 자유게시판 (Span 2) */}
        <div className="md:col-span-2 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <MessageSquare className="h-5 w-5" />
              <h2>팬들의 이야기</h2>
            </div>
            <Link href="/c/free" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
              더보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {freePosts && freePosts.length > 0 ? (
              freePosts.map((post) => {
                const author = Array.isArray(post.author) ? post.author[0] : post.author;
                return (
                  <Link key={post.id} href={`/c/free/${post.id}`} className="group flex flex-col justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 hover:border-primary/30 transition-all">
                    <p className="font-medium text-white/90 group-hover:text-primary transition-colors line-clamp-2 mb-3 text-sm">
                      {post.title}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-5 h-5 rounded-full border border-white/10 object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/10" />
                        )}
                        <span className="text-xs text-muted-foreground">{author?.display_name ?? author?.username}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70">{timeAgo(post.created_at)}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground rounded-xl bg-white/5 border border-white/5">
                아직 작성된 글이 없습니다.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
