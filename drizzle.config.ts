import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Default: `.env` then `.env.local` (local Postgres wins).
// Production migrate without moving files:
//   DOTENV_PATH=.env pnpm db:migrate
const envFile = process.env.DOTENV_PATH;
if (envFile) {
  config({ path: envFile, override: true, quiet: true });
} else {
  config({ path: '.env', quiet: true });
  config({ path: '.env.local', override: true, quiet: true });
}

export default defineConfig({
  out: './lib/db/migrations',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
