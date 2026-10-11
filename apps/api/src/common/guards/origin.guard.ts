import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (the session cookie is also SameSite=Strict): state-changing
 * requests sent by a browser must carry an Origin listed in FRONTEND_ORIGINS.
 * Requests without an Origin header (server-to-server, curl) are allowed because a
 * browser always sends Origin on cross-site unsafe requests.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowed: Set<string>;

  constructor(config: AppConfigService) {
    this.allowed = new Set(config.get('FRONTEND_ORIGINS'));
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;
    const origin = req.headers.origin;
    if (origin === undefined || this.allowed.has(origin)) return true;
    throw new ForbiddenException('Cross-origin request rejected');
  }
}
