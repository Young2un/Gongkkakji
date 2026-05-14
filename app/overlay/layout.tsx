/**
 * OBS 오버레이 전용 레이아웃.
 * 헤더/네비 등 일반 페이지 chrome 없이 룰렛만 그리기 위해
 * (main) 라우트 그룹 바깥에 둠.
 */
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen text-foreground">{children}</div>;
}
