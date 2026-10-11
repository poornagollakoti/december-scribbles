import { LIMITS } from '@ds/contracts';

/** Converts a title into a URL slug: "Winter Light, Again!" -> "winter-light-again". */
export function slugify(input: string, maxLength: number = LIMITS.slugMax): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'untitled';
}

/** Returns `base`, or `base-2`, `base-3`... — the first candidate for which `isTaken` is false. */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base;
  for (let n = 2; await isTaken(candidate); n++) {
    const suffix = `-${n}`;
    candidate = `${base.slice(0, LIMITS.slugMax - suffix.length)}${suffix}`;
  }
  return candidate;
}
