import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '공은이를 향한 박수갈채',
  description: '치지직 스트리머와 팬들의 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
