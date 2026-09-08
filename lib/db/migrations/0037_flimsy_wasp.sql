ALTER TABLE "bookmarks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user_deleted" ON "bookmarks" USING btree ("user_id","deleted_at");