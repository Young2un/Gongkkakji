'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

/**
 * 위키 본문 마크다운 렌더러.
 * - remark-gfm: 표 / 체크박스 / 취소선 / 자동 링크
 * - rehype-slug: heading 에 id 부여 → 목차 앵커 이동
 * - 원시 HTML은 렌더하지 않음(rehype-raw 미사용) → XSS 안전
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-7 text-foreground/90 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h1: (props) => (
            <h1 className="mt-6 mb-3 scroll-mt-24 border-b border-white/10 pb-1.5 text-2xl font-black" {...props} />
          ),
          h2: (props) => (
            <h2 className="mt-6 mb-3 scroll-mt-24 border-b border-white/10 pb-1 text-xl font-bold" {...props} />
          ),
          h3: (props) => <h3 className="mt-5 mb-2 scroll-mt-24 text-lg font-bold" {...props} />,
          h4: (props) => <h4 className="mt-4 mb-2 scroll-mt-24 font-bold" {...props} />,
          p: (props) => <p className="my-3" {...props} />,
          a: ({ href, ...props }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...props}
              />
            );
          },
          ul: (props) => <ul className="my-3 list-disc space-y-1 pl-6" {...props} />,
          ol: (props) => <ol className="my-3 list-decimal space-y-1 pl-6" {...props} />,
          li: (props) => <li className="marker:text-muted-foreground" {...props} />,
          blockquote: (props) => (
            <blockquote
              className="my-4 border-l-2 border-primary/50 pl-4 text-muted-foreground"
              {...props}
            />
          ),
          hr: () => <hr className="my-6 border-white/10" />,
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? '');
            if (isBlock) {
              return (
                <code className={`${className ?? ''} block`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-white/10 px-1.5 py-0.5 text-[13px] font-mono text-accent"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre
              className="my-4 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[13px] font-mono"
              {...props}
            />
          ),
          table: (props) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: (props) => (
            <th className="border border-white/10 bg-white/5 px-3 py-1.5 text-left font-semibold" {...props} />
          ),
          td: (props) => <td className="border border-white/10 px-3 py-1.5" {...props} />,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ''} className="my-3 max-w-full rounded-lg border border-white/10" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
