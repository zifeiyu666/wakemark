CREATE TYPE "public"."notion_sync_status" AS ENUM('idle', 'syncing', 'error');--> statement-breakpoint
CREATE TABLE "notion_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" text,
	"workspace_name" text,
	"bot_id" text,
	"access_token" text NOT NULL,
	"parent_page_id" text,
	"database_id" text,
	"auto_sync_enabled" boolean DEFAULT false NOT NULL,
	"sync_status" "notion_sync_status" DEFAULT 'idle' NOT NULL,
	"cursor_bookmark_id" uuid,
	"last_synced_at" timestamp with time zone,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notion_connections_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "notion_page_id" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "notion_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notion_connections" ADD CONSTRAINT "notion_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notion_connections_user_id" ON "notion_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_notion_pending" ON "bookmarks" USING btree ("user_id");
