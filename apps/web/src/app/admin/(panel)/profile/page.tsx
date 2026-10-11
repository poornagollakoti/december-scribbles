import type { SessionUser, SiteProfile } from '@ds/contracts';
import { AdminEmpty, AdminHeader } from '@/components/admin/admin-ui';
import { ProfileForm } from '@/components/admin/profile-form';
import { adminGet } from '@/lib/api/server';

export const metadata = { title: 'Settings' };

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([
    adminGet<SessionUser>('/auth/me'),
    adminGet<SiteProfile>('/site-profile'),
  ]);
  return (
    <>
      <AdminHeader
        title="Settings"
        description="The name, tagline, About text and contact links used across the site."
      />
      {user.role === 'ADMIN' ? (
        <ProfileForm initial={profile} />
      ) : (
        <AdminEmpty>Only administrators can change the site profile.</AdminEmpty>
      )}
    </>
  );
}
