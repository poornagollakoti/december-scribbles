import type { AdminGalleryListResponse } from '@ds/contracts';
import { AdminHeader } from '@/components/admin/admin-ui';
import { GalleryEditor } from '@/components/admin/gallery-editor';
import { adminGet } from '@/lib/api/server';

export const metadata = { title: 'Add artwork' };

export default async function NewArtworkPage() {
  const { categories } = await adminGet<AdminGalleryListResponse>('/admin/gallery', {
    pageSize: 1,
  });
  return (
    <>
      <AdminHeader
        title="Add artwork"
        back={{ href: '/admin/gallery', label: 'Posters & Illustrations' }}
      />
      <GalleryEditor categories={categories} />
    </>
  );
}
