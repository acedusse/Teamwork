import { z } from 'zod';

export const AgentSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  status: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});

export const AgentUpdateSchema = AgentSchema.partial();
