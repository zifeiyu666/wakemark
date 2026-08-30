CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."bookmark_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."x_sync_status" AS ENUM('idle', 'syncing', 'processing', 'error');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tweet_id" text NOT NULL,
	"text" text NOT NULL,
	"author_x_id" text,
	"author_username" text,
	"author_name" text,
	"author_profile_image_url" text,
	"tweet_created_at" timestamp with time zone,
	"media_urls" jsonb DEFAULT '[]' NOT NULL,
	"metrics" jsonb,
	"urls" jsonb DEFAULT '[]' NOT NULL,
	"primary_category" varchar(50),
	"sub_tags" jsonb DEFAULT '[]' NOT NULL,
	"summary" text,
	"embedding" vector(1536),
	"status" "bookmark_status" DEFAULT 'pending' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_pushed" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_tweet_id_unique" UNIQUE("user_id","tweet_id")
);
--> statement-breakpoint
CREATE TABLE "x_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"x_user_id" text NOT NULL,
	"username" text,
	"name" text,
	"profile_image_url" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"scopes" text,
	"sync_status" "x_sync_status" DEFAULT 'idle' NOT NULL,
	"pagination_token" text,
	"last_synced_at" timestamp with time zone,
	"last_sync_added" integer DEFAULT 0,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "x_connections_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "x_connections" ADD CONSTRAINT "x_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user_synced" ON "bookmarks" USING btree ("user_id","synced_at");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user_read" ON "bookmarks" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user_status" ON "bookmarks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_x_connections_user_id" ON "x_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookmarks_embedding_hnsw" ON "bookmarks" USING hnsw ("embedding" vector_cosine_ops);