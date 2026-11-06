import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  // Public origin of this API; used to build absolute URLs for uploaded images.
  PUBLIC_URL: z.string().default('http://localhost:3000').transform((v) => v.replace(/\/+$/, '')),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().default(900), // 15 min
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().default(604800), // 7 days
  ADMIN_NAME: z.string().default('Store Admin'),
  ADMIN_EMAIL: z.string().default('admin@calishop.com'),
  ADMIN_PASSWORD: z.string().default('Admin12345!'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
};
