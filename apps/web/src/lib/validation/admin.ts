import {
  INSTAGRAM_POST_PATTERN,
  CONTENT_KINDS,
  CONTENT_STATUSES,
  LIMITS,
  SLUG_PATTERN,
} from '@ds/contracts';
import { z } from 'zod';

/** Client-side mirrors of the API DTO rules for the admin forms. The API remains the authority. */

const slug = z
  .string()
  .trim()
  .max(LIMITS.slugMax)
  .refine(
    (v) => v === '' || SLUG_PATTERN.test(v),
    'Use lowercase letters, numbers and single hyphens',
  );

export const contentSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(LIMITS.titleMax),
  slug,
  kind: z.enum(CONTENT_KINDS),
  status: z.enum(CONTENT_STATUSES),
  excerpt: z.string().trim().max(LIMITS.excerptMax, `At most ${LIMITS.excerptMax} characters`),
  body: z.string().trim().min(1, 'Write something first').max(LIMITS.bodyMax),
  coverImageId: z.string().nullable(),
});
export type ContentFormValues = z.infer<typeof contentSchema>;

export const gallerySchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(LIMITS.titleMax),
  slug,
  description: z.string().trim().max(LIMITS.descriptionMax),
  category: z.string().trim().max(LIMITS.categoryMax),
  imageId: z.string({ error: 'Choose an image' }).min(1, 'Choose an image'),
  altText: z
    .string()
    .trim()
    .min(1, 'Describe the image for people using screen readers')
    .max(LIMITS.altTextMax),
  displayOrder: z.number({ error: 'Enter a number' }).int().min(0).max(100_000),
  isPublished: z.boolean(),
  instagramUrl: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || INSTAGRAM_POST_PATTERN.test(v),
      'Paste a post or reel link, e.g. https://www.instagram.com/p/AbC123/',
    ),
});
export type GalleryFormValues = z.infer<typeof gallerySchema>;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Required').max(LIMITS.titleMax),
  tagline: z.string().trim().min(1, 'Required').max(LIMITS.excerptMax),
  aboutBody: z.string().trim().max(LIMITS.bodyMax),
  contactEmail: z
    .string()
    .trim()
    .max(LIMITS.emailMax)
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email'),
  instagramUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === '' || /^https:\/\/\S+$/.test(v), 'Enter a full https:// link'),
  aboutImageId: z.string().nullable(),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Empty optional strings are sent as null so the API clears the field. */
export function emptyToNull(value: string): string | null {
  return value.trim() === '' ? null : value;
}
