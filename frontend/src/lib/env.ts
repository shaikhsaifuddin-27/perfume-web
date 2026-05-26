import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 chars'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

// Validate and export — throws a descriptive error at startup if misconfigured
function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`\n❌ Invalid environment variables:\n${missing}\n\nCheck your .env file.\n`);
  }
  return result.data;
}

// Only validate in server-side code (not during static analysis)
export const env = typeof window === 'undefined' ? validateEnv() : ({} as z.infer<typeof envSchema>);
