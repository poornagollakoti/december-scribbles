import { Transform } from 'class-transformer';

/** Normalises user-entered text: unifies newlines and trims surrounding whitespace. */
export function cleanText(value: unknown): unknown {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : value;
}

/** DTO decorator: trims text. */
export const Trim = () => Transform(({ value }) => cleanText(value));

/** DTO decorator: trims text and maps empty strings to null (optional nullable fields). */
export const TrimToNull = () =>
  Transform(({ value }) => {
    const cleaned = cleanText(value);
    return cleaned === '' ? null : cleaned;
  });
