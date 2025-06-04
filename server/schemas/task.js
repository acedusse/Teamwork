import { z } from 'zod';

export const TaskSchema = z.object({
	title: z.string(),
	description: z.string(),
	status: z.string().optional(),
	dependencies: z.array(z.number()).optional(),
	priority: z.string().optional(),
	details: z.string().optional(),
	testStrategy: z.string().optional()
});
