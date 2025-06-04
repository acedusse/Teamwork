import { z } from 'zod';

export const SprintSchema = z.object({
  name: z.string(),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  tasks: z.array(z.number()).optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional()
});
