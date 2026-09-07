import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit preloads `.env`. Reload `.env.local` with override so local
// Postgres wins over the Neon URL during `pnpm db:migrate`.
config({ path: '.env', quiet: true });
config({ path: '.env.local', override: true, quiet: true });

export default defineConfig({
  out: './lib/db/migrations',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
