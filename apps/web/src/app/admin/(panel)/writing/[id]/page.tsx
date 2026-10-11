import { AdminHeader } from '@/components/admin/admin-ui';
import { ContentEditor } from '@/components/admin/content-editor';
import { loadContent } from '@/lib/admin-data';

export const metadata = { title: 'Edit writing' };

type Props = { params: Promise<{ id: string }> };

export default async function EditWritingPage({ params }: Props) {
  const item = await loadContent((await params).id);
  return (
    <>
      <AdminHeader title="Edit writing" back={{ href: '/admin/writing', label: 'All writing' }} />
      {/* key: reset the form when navigating between pieces */}
      <ContentEditor key={item.id} initial={item} />
    </>
  );
}
