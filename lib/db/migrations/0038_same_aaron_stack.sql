ALTER TABLE "bookmarks" ADD COLUMN "synced_via" varchar(20) DEFAULT 'api' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "is_archived_full" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "x_connections" ADD COLUMN "initial_api_sync_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "x_connections" ADD COLUMN "last_synced_tweet_id" varchar(64);--> statement-breakpoint
ALTER TABLE "x_connections" ADD COLUMN "total_synced_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "x_connections" ADD COLUMN "history_import_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "x_connections" AS xc
SET "history_import_completed" = true
WHERE xc."pagination_token" IS NULL
  AND xc."last_synced_at" IS NOT NULL
  AND (
    SELECT count(*) FROM "bookmarks" b
    WHERE b."user_id" = xc."user_id" AND b."deleted_at" IS NULL
  ) > 20;--> statement-breakpoint
UPDATE "x_connections"
SET "initial_api_sync_completed" = true
WHERE "last_synced_at" IS NOT NULL;--> statement-breakpoint
UPDATE "x_connections" AS xc
SET "total_synced_count" = COALESCE((
  SELECT count(*)::int FROM "bookmarks" b WHERE b."user_id" = xc."user_id"
), 0);--> statement-breakpoint
UPDATE "x_connections" SET "pagination_token" = NULL;