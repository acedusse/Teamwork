import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional()
});

export function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error}`);
  }
  const env = result.data;
  return {
    port: env.PORT ? parseInt(env.PORT, 10) : 3500,
    corsOrigin: env.CORS_ORIGIN || '*',
    logLevel: env.LOG_LEVEL || 'info'
  };
}

const config = loadConfig();
export default config;
