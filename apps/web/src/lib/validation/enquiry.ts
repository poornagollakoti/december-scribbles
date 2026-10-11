import { ENQUIRY_TYPES, LIMITS } from '@ds/contracts';
import { z } from 'zod';

/** Client-side mirror of the API's CreateEnquiryDto rules. The API remains the authority. */
export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please tell us your name')
    .max(LIMITS.nameMax, `Name must be at most ${LIMITS.nameMax} characters`),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .max(LIMITS.emailMax)
    .pipe(z.email('Please enter a valid email address')),
  type: z.enum(ENQUIRY_TYPES),
  subject: z
    .string()
    .trim()
    .max(LIMITS.subjectMax, `Subject must be at most ${LIMITS.subjectMax} characters`),
  message: z
    .string()
    .trim()
    .min(LIMITS.messageMin, `Message must be at least ${LIMITS.messageMin} characters`)
    .max(LIMITS.messageMax, `Message must be at most ${LIMITS.messageMax} characters`),
  /** Honeypot; hidden from people. */
  website: z.string(),
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;

export const enquiryDefaults: EnquiryFormValues = {
  name: '',
  email: '',
  type: 'GENERAL',
  subject: '',
  message: '',
  website: '',
};
