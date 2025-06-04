import { z } from 'zod';

export const GenerateTasksSchema = z.object({
  numTasks: z.number().int().positive().optional().default(10),
  force: z.boolean().optional().default(false),
  append: z.boolean().optional().default(false),
  research: z.boolean().optional().default(false),
});
