import { SetMetadata } from '@nestjs/common';
import type { Role } from '@ds/contracts';

export const ROLES_KEY = 'roles';

/** Restricts a handler or controller to the given roles (checked by `RolesGuard`). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
