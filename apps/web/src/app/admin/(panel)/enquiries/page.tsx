import {
  ENQUIRY_STATUSES,
  type AdminEnquiry,
  type EnquiryStatus,
  type Paginated,
} from '@ds/contracts';
import { AdminEmpty, AdminHeader, AdminPagination, FilterTabs } from '@/components/admin/admin-ui';
import { EnquiryCard } from '@/components/admin/enquiry-card';
import { ApiRequestError } from '@/lib/api/errors';
import { adminGet } from '@/lib/api/server';
import { parsePage } from '@/lib/site';

export const metadata = { title: 'Enquiries' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = ENQUIRY_STATUSES.find((s) => s === first(params.status));
  const page = parsePage(params.page);

  let result: Paginated<AdminEnquiry>;
  try {
    result = await adminGet<Paginated<AdminEnquiry>>('/admin/enquiries', {
      status,
      page,
      pageSize: 20,
    });
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 403) {
      return (
        <>
          <AdminHeader title="Enquiries" />
          <AdminEmpty title="Administrators only" icon="inbox">
            Enquiries contain visitors&apos; personal details, so only administrators can read them.
          </AdminEmpty>
        </>
      );
    }
    throw e;
  }

  const hrefFor = (p: number, s: EnquiryStatus | undefined = status) => {
    const qs = new URLSearchParams();
    if (s) qs.set('status', s);
    if (p > 1) qs.set('page', String(p));
    const q = qs.toString();
    return q ? `/admin/enquiries?${q}` : '/admin/enquiries';
  };

  return (
    <>
      <AdminHeader title="Enquiries" description="Messages sent through the contact form." />
      <FilterTabs
        label="Filter by status"
        options={[undefined, ...ENQUIRY_STATUSES].map((s) => ({
          href: hrefFor(1, s),
          label: s ? s.charAt(0) + s.slice(1).toLowerCase() : 'All',
          active: status === s,
        }))}
      />
      <div className="mt-6" />
      {result.items.length ? (
        <ul className="space-y-4">
          {result.items.map((e) => (
            <EnquiryCard key={e.id} enquiry={e} />
          ))}
        </ul>
      ) : (
        <AdminEmpty title={status ? 'Nothing here' : 'No messages yet'} icon="inbox">
          {status
            ? 'No enquiries with this status.'
            : 'Messages sent through the contact form will appear here.'}
        </AdminEmpty>
      )}
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(p) => hrefFor(p)}
      />
    </>
  );
}
