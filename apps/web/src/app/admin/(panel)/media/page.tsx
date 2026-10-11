import type { MediaAsset, Paginated } from '@ds/contracts';
import { AdminHeader, AdminPagination } from '@/components/admin/admin-ui';
import { MediaLibrary } from '@/components/admin/media-library';
import { adminGet } from '@/lib/api/server';
import { parsePage } from '@/lib/site';

export const metadata = { title: 'Media' };

type SearchParams = Promise<{ page?: string | string[] }>;

export default async function MediaPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePage((await searchParams).page);
  const result = await adminGet<Paginated<MediaAsset>>('/admin/media', { page, pageSize: 24 });
  return (
    <>
      <AdminHeader
        title="Media library"
        description="Images are checked, resized and converted to WebP on upload. Location data and other metadata is removed."
      />
      <MediaLibrary items={result.items} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(p) => (p > 1 ? `/admin/media?page=${p}` : '/admin/media')}
      />
    </>
  );
}
