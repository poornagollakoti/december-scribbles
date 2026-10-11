import type { SessionUser } from '@ds/contracts';
import { FeedbackProvider } from './feedback';
import { StudioFrame } from './studio-frame';

/** Studio application shell: sidebar, top bar, toasts and confirmation dialogs. */
export function AdminShell({
  user,
  newEnquiries,
  children,
}: {
  user: SessionUser;
  newEnquiries: number;
  children: React.ReactNode;
}) {
  return (
    <FeedbackProvider>
      <StudioFrame user={user} newEnquiries={newEnquiries}>
        {children}
      </StudioFrame>
    </FeedbackProvider>
  );
}
