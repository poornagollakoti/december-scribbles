/**
 * Shared API contract for the December Scribbles API (`apps/api`) and website (`apps/web`).
 *
 * Everything here describes JSON on the wire: dates are ISO-8601 strings, ids are UUIDs.
 * The API's services return these shapes and the website's API client consumes them,
 * so a breaking change here fails type checking on both sides.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export const CONTENT_KINDS = ['POEM', 'QUOTE', 'PROSE', 'BOOK_NOTE'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  POEM: 'Poetry',
  QUOTE: 'Quotes',
  PROSE: 'Prose',
  BOOK_NOTE: "Bookworm's Closet",
};

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ENQUIRY_TYPES = ['GENERAL', 'COLLABORATION', 'COMMISSION', 'FEEDBACK'] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const ENQUIRY_TYPE_LABELS: Record<EnquiryType, string> = {
  GENERAL: 'General message',
  COLLABORATION: 'Collaboration',
  COMMISSION: 'Commission request',
  FEEDBACK: 'Feedback',
};

export const ENQUIRY_STATUSES = ['NEW', 'READ', 'ARCHIVED'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ROLES = ['ADMIN', 'EDITOR'] as const;
export type Role = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Validation limits (enforced by the API, mirrored by website forms)
// ---------------------------------------------------------------------------

export const LIMITS = {
  slugMax: 120,
  titleMax: 160,
  excerptMax: 300,
  bodyMax: 20_000,
  categoryMax: 60,
  descriptionMax: 2_000,
  altTextMax: 300,
  nameMax: 100,
  emailMax: 254,
  subjectMax: 160,
  messageMin: 10,
  messageMax: 5_000,
  passwordMin: 12,
  uploadMaxBytes: 10 * 1024 * 1024,
  pageSizeMax: 50,
} as const;

/** Lowercase words separated by single hyphens, e.g. `winter-light`. */
/** Accepted Instagram post/reel links. */
export const INSTAGRAM_POST_PATTERN =
  /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

// ---------------------------------------------------------------------------
// Common shapes
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

/** Every non-2xx response from the API has this body. */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: ApiFieldError[];
  requestId?: string;
  path: string;
  timestamp: string;
}

export interface ImageRef {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  alt: string;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ok' | 'error';
  checks: { database: 'up' | 'down' };
}

// ---------------------------------------------------------------------------
// Public content
// ---------------------------------------------------------------------------

export interface SiteProfile {
  displayName: string;
  tagline: string;
  aboutBody: string;
  contactEmail: string | null;
  instagramUrl: string | null;
  /** Optional owner-supplied image for the About section. */
  aboutImage: ImageRef | null;
  updatedAt: string;
}

export interface ContentSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  kind: ContentKind;
  publishedAt: string | null;
  coverImage: ImageRef | null;
}

export interface ContentDetail extends ContentSummary {
  /** Plain text; line breaks are significant and must be preserved when rendered. */
  body: string;
}

export interface ContentLink {
  slug: string;
  title: string;
  kind: ContentKind;
}

/** A published piece as shown publicly, with its neighbours in publication order. */
export interface PublishedContent extends ContentDetail {
  /** The next newer published piece, if any. */
  newer: ContentLink | null;
  /** The next older published piece, if any. */
  older: ContentLink | null;
}

/** Number of published pieces per writing type (types with none are omitted). */
export interface ContentKindCount {
  kind: ContentKind;
  count: number;
}

export interface ContentListQuery {
  kind?: ContentKind;
  page?: number;
  pageSize?: number;
}

export interface GalleryItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  image: ImageRef;
  displayOrder: number;
  /** Link to the original Instagram post, when the owner has added one. */
  instagramUrl: string | null;
}

export interface GalleryListQuery {
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface GalleryListResponse extends Paginated<GalleryItem> {
  categories: string[];
}

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

export interface CreateEnquiryRequest {
  name: string;
  email: string;
  type: EnquiryType;
  subject?: string;
  message: string;
  /** Honeypot: real visitors never fill this in. */
  website?: string;
}

export interface EnquiryReceipt {
  id: string;
  receivedAt: string;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

export interface AdminContent extends ContentDetail {
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContentUpsertRequest {
  title: string;
  /** Generated from the title when omitted on create. */
  slug?: string;
  excerpt?: string | null;
  body: string;
  kind: ContentKind;
  status: ContentStatus;
  coverImageId?: string | null;
}

export interface AdminContentListQuery {
  status?: ContentStatus;
  kind?: ContentKind;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const GALLERY_VISIBILITIES = ['published', 'hidden'] as const;
export type GalleryVisibility = (typeof GALLERY_VISIBILITIES)[number];

export const GALLERY_SORTS = ['order', 'updated'] as const;
export type GallerySort = (typeof GALLERY_SORTS)[number];

export interface AdminGalleryListQuery {
  visibility?: GalleryVisibility;
  category?: string;
  /** Matches titles, case-insensitively. */
  search?: string;
  /** `order` = display order (default), `updated` = most recently edited first. */
  sort?: GallerySort;
  page?: number;
  pageSize?: number;
}

export interface AdminGalleryListResponse extends Paginated<AdminGalleryItem> {
  /** Every category in use, including on hidden artwork. */
  categories: string[];
}

export interface AdminGalleryItem extends GalleryItem {
  isPublished: boolean;
  altText: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryUpsertRequest {
  title: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  imageId: string;
  altText: string;
  displayOrder?: number;
  isPublished?: boolean;
  instagramUrl?: string | null;
}

/** A library image. `alt` is the library alt text (used for writing cover images). */
export interface MediaAsset extends ImageRef {
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  /** Number of writing and gallery items using this image; in-use images cannot be deleted. */
  usageCount: number;
  createdAt: string;
}

export interface MediaUpdateRequest {
  altText: string;
}

export interface AdminEnquiry {
  id: string;
  name: string;
  email: string;
  type: EnquiryType;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  notifiedAt: string | null;
  createdAt: string;
}

export interface AdminEnquiryListQuery {
  status?: EnquiryStatus;
  page?: number;
  pageSize?: number;
}

export interface EnquiryStatusUpdateRequest {
  status: EnquiryStatus;
}

export interface SiteProfileUpdateRequest {
  displayName: string;
  tagline: string;
  aboutBody: string;
  contactEmail?: string | null;
  instagramUrl?: string | null;
  aboutImageId?: string | null;
}

export interface DashboardStats {
  content: { published: number; draft: number; archived: number };
  gallery: { published: number; hidden: number };
  enquiries: { new: number; total: number };
  media: { total: number };
}
