import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUser } from '@ds/contracts';
import type { AuthenticatedRequest } from '../types';

/** Injects the authenticated admin user. Only valid behind `SessionGuard`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
