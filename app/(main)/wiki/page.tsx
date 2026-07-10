import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';
import { WIKI_SLUG, WIKI_DEFAULT_TITLE } from '@/lib/wiki';
import { WikiPage } from '@/components/wiki/wiki-page';

export const metadata = { title: '공은위키' };

export default async function WikiHomePage() {
  const supabase = createClient();

  const [{ data: doc }, { data: auth }] = await Promise.all([
    supabase
      .from('wiki_documents')
      .select(
        'title, content, updated_at, editor:profiles!wiki_documents_updated_by_fkey(display_name, username)'
      )
      .eq('slug', WIKI_SLUG)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const editor = doc ? (Array.isArray(doc.editor) ? doc.editor[0] : doc.editor) : null;

  return (
    <WikiPage
      initialTitle={doc?.title ?? WIKI_DEFAULT_TITLE}
      initialContent={doc?.content ?? ''}
      updatedLabel={doc?.updated_at ? timeAgo(doc.updated_at) : null}
      editorName={editor ? editor.display_name ?? editor.username : null}
      canEdit={!!auth?.user}
    />
  );
}
