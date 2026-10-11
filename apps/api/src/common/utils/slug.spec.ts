import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it.each([
    ['Winter Light, Again!', 'winter-light-again'],
    ['  Café   au  lait  ', 'cafe-au-lait'],
    ["Bookworm's Closet", 'bookworms-closet'],
    ['Bookworm’s Closet', 'bookworms-closet'],
    ['---', 'untitled'],
    ['हिंदी', 'untitled'],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('truncates without leaving a trailing hyphen', () => {
    const slug = slugify('word '.repeat(60), 12);
    expect(slug.length).toBeLessThanOrEqual(12);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when it is free', async () => {
    await expect(uniqueSlug('poem', () => Promise.resolve(false))).resolves.toBe('poem');
  });

  it('appends the first free numeric suffix', async () => {
    const taken = new Set(['poem', 'poem-2']);
    await expect(uniqueSlug('poem', (s) => Promise.resolve(taken.has(s)))).resolves.toBe('poem-3');
  });
});
