import { ValidationError, ValidationPipe } from '@nestjs/common';
import type { ApiFieldError } from '@ds/contracts';
import { ValidationFailedException } from '../filters/all-exceptions.filter';

function flatten(errors: ValidationError[], parent = ''): ApiFieldError[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = Object.values(e.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flatten(e.children ?? [], field)];
  });
}

/** Strict global validation: unknown properties are rejected, payloads are transformed to DTOs. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new ValidationFailedException(flatten(errors)),
  });
}
