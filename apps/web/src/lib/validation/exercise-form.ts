import { z } from 'zod';

const optionalUrl = z.string().trim().refine((value) => value === '' || z.url({ protocol: /^https?$/ }).safeParse(value).success, 'url');

export const exerciseFormSchema = z.object({
  keyName: z.string().trim().min(1, 'keyNameRequired'),
  name: z.string().trim().min(1, 'nameRequired'),
  description: z.string(),
  type: z.enum(['ISOTONIC', 'ISOMETRIC', 'MANUAL', 'RELAXATION']),
  category: z.enum(['WARMUP', 'CORE', 'COOLDOWN']),
  mobileModule: z.enum(['EYES', 'EYES_INVERSE', 'BROWS', 'JAW', 'SMILE', 'KISS']).optional(),
  assetAnimationUrl: optionalUrl,
  assetTutorialVideoUrl: optionalUrl,
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;
