import type { SessionUser } from '@ds/contracts';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
  sessionId: string;
}

export const SESSION_COOKIE = 'ds_session';
