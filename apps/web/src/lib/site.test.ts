import { describe, expect, it } from 'vitest';
import { paragraphs, parsePage } from './site';
import { enquirySchema, enquiryDefaults } from './validation/enquiry';

describe('paragraphs', () => {
  it('splits on blank lines, including whitespace-only ones, and drops empties', () => {
    expect(paragraphs('a\nb\n\n  \nc\n\n\n')).toEqual(['a\nb', 'c']);
    expect(paragraphs('')).toEqual([]);
  });
});

describe('parsePage', () => {
  it.each([
    [undefined, 1],
    ['3', 3],
    [['4', '5'], 4],
    ['0', 1],
    ['-2', 1],
    ['1.5', 1],
    ['abc', 1],
    ['99999', 1],
  ])('%j -> %i', (input, expected) => {
    expect(parsePage(input)).toBe(expected);
  });
});

describe('enquirySchema', () => {
  const valid = {
    ...enquiryDefaults,
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Hello there, friend!',
  };

  it('accepts a valid enquiry and trims input', () => {
    const parsed = enquirySchema.parse({ ...valid, name: '  Ada  ' });
    expect(parsed.name).toBe('Ada');
  });

  it.each([
    ['empty name', { name: '   ' }],
    ['bad email', { email: 'ada@' }],
    ['short message', { message: 'hi' }],
    ['long message', { message: 'x'.repeat(5001) }],
    ['unknown type', { type: 'SPAM' }],
  ])('rejects %s', (_label, override) => {
    expect(enquirySchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
