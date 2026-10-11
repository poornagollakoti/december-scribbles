import type { AdminGalleryListResponse } from '@ds/contracts';
import { AdminHeader } from '@/components/admin/admin-ui';
import { GalleryEditor } from '@/components/admin/gallery-editor';
import { loadArtwork } from '@/lib/admin-data';
import { adminGet } from '@/lib/api/server';

export const metadata = { title: 'Edit artwork' };

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, { categories }] = await Promise.all([
    loadArtwork(id),
    adminGet<AdminGalleryListResponse>('/admin/gallery', { pageSize: 1 }),
  ]);
  return (
    <>
      <AdminHeader
        title="Edit artwork"
        back={{ href: '/admin/gallery', label: 'Posters & Illustrations' }}
      />
      <GalleryEditor key={item.id} initial={item} categories={categories} />
    </>
  );
}
