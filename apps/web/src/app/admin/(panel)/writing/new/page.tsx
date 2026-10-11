import { ContentEditor } from '@/components/admin/content-editor';
import { AdminHeader } from '@/components/admin/admin-ui';

export const metadata = { title: 'New writing' };

export default function NewWritingPage() {
  return (
    <>
      <AdminHeader title="New writing" back={{ href: '/admin/writing', label: 'All writing' }} />
      <ContentEditor />
    </>
  );
}
