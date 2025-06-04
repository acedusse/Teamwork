import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.string().optional(),
  dependencies: z.array(z.number()).optional(),
  priority: z.string().optional(),
  agent: z.string().optional(),
  epic: z.string().optional(),
  details: z.string().optional(),
  testStrategy: z.string().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional()
});
