import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe as describeError, ValidationFailedException } from './all-exceptions.filter';

const prismaError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('db error with secrets', {
    code,
    clientVersion: 'x',
    meta,
  });

describe('exception mapping', () => {
  it('keeps validation details', () => {
    const result = describeError(
      new ValidationFailedException([{ field: 'email', message: 'bad' }]),
    );
    expect(result).toEqual({
      statusCode: 400,
      message: 'Validation failed',
      details: [{ field: 'email', message: 'bad' }],
    });
  });

  it('passes through HTTP exceptions', () => {
    expect(describeError(new NotFoundException('Writing not found'))).toEqual({
      statusCode: 404,
      message: 'Writing not found',
    });
  });

  it('maps unique-constraint violations to 409 without leaking the database message', () => {
    const result = describeError(prismaError('P2002', { target: ['slug'] }));
    expect(result).toEqual({ statusCode: 409, message: 'A record with this slug already exists' });
  });

  it('maps foreign-key violations to 409', () => {
    expect(describeError(prismaError('P2003')).statusCode).toBe(409);
  });

  it('hides unexpected errors behind a generic 500', () => {
    expect(describeError(new Error('connection string postgres://user:pass@host'))).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
  });
});
