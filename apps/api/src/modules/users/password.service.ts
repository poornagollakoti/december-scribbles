import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Argon2id parameters (OWASP-recommended baseline: 19 MiB, 2 iterations). */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  /** A real hash used to keep timing consistent when the account does not exist. */
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return argon2.hash(password, HASH_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, HASH_OPTIONS);
  }

  /** Spends the same effort as a real verification, then fails. */
  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('december-scribbles-timing-equaliser');
    await this.verify(await this.dummyHash, password);
    return false;
  }
}
