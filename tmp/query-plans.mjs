import { readFileSync } from 'fs';
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*'([^']*)'/);
  if (m) process.env[m[1]] = m[2];
}
const { default: postgres } = await import('postgres');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const rows = await sql`select group_slug, display_order, card_title, price, currency, display_price, original_price, price_suffix, is_highlighted, is_active, lang_jsonb from pricing_plans order by group_slug, display_order`;
console.log(JSON.stringify(rows, null, 2));
await sql.end();
