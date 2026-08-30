-- voyage-4-lite embeddings are 1024-dim (was 1536 for text-embedding-3-small).
-- Postgres cannot cast vector(1536) to vector(1024) in place; the column holds
-- no production data yet, so recreate it and rebuild the hnsw index.
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_bookmarks_embedding_hnsw";
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "embedding";
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "embedding" vector(1024);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookmarks_embedding_hnsw" ON "bookmarks" USING hnsw ("embedding" vector_cosine_ops);
