/**
 * 스트리머 컨트롤 페이지 레이아웃.
 * (main) 레이아웃의 헤더/네비 없이 컴팩트하게.
 */
export default function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background dark text-foreground">
      <div className="mx-auto max-w-md px-4 py-6">{children}</div>
    </div>
  );
}
