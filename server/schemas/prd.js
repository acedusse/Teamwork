import { z } from 'zod';

export const PRDSchema = z.object({
  content: z.string().min(1),
});
