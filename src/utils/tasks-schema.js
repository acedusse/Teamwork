import { z } from 'zod';

export const subtaskSchema = z
	.object({
		id: z.number(),
		title: z.string(),
		description: z.string(),
		status: z.string(),
		dependencies: z.array(z.number()).optional().default([])
	})
	.passthrough();

export const taskSchema = z
	.object({
		id: z.number(),
		title: z.string(),
		description: z.string(),
		status: z.string(),
		priority: z.string(),
		dependencies: z.array(z.number()),
		details: z.string().optional(),
		testStrategy: z.string().optional(),
		subtasks: z.array(subtaskSchema).optional()
	})
	.passthrough();

export const tasksFileSchema = z.object({
	schemaVersion: z.number().default(1),
	tasks: z.array(taskSchema)
});
