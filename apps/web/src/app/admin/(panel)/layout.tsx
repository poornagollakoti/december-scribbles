import type { DashboardStats, SessionUser } from '@ds/contracts';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiRequestError } from '@/lib/api/errors';
import { adminGet } from '@/lib/api/server';

export const metadata: Metadata = {
  title: { default: 'Studio', template: '%s · Studio · December Scribbles' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: SessionUser;
  try {
    user = await adminGet<SessionUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect('/admin/login');
    throw error;
  }
  // Only used for the sidebar's "new enquiries" badge; never block the Studio on it.
  const stats = await adminGet<DashboardStats>('/admin/stats').catch(() => null);
  return (
    <AdminShell user={user} newEnquiries={user.role === 'ADMIN' ? (stats?.enquiries.new ?? 0) : 0}>
      {children}
    </AdminShell>
  );
}
