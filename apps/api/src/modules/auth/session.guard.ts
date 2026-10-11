import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SESSION_COOKIE, type AuthenticatedRequest } from '../../common/types';
import { AuthService } from './auth.service';

/** Requires a valid admin session cookie; attaches `req.user` and `req.sessionId`. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const session = await this.auth.validate(cookies?.[SESSION_COOKIE]);
    if (!session) throw new UnauthorizedException('Authentication required');
    req.user = session.user;
    req.sessionId = session.sessionId;
    return true;
  }
}
