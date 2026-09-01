CREATE TABLE "bookmark_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(60) NOT NULL,
	"usage" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_tags_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookmark_tags_user_usage" ON "bookmark_tags" USING btree ("user_id","usage");
--> statement-breakpoint
-- Backfill usage counters from existing bookmarks (idempotent: re-running
-- reconciles counts with the source data).
INSERT INTO "bookmark_tags" ("user_id", "name", "usage")
SELECT b."user_id", tag.value, count(*)
FROM "bookmarks" b, jsonb_array_elements_text(b."sub_tags") AS tag(value)
WHERE trim(tag.value) <> ''
GROUP BY b."user_id", tag.value
ON CONFLICT ("user_id", "name") DO UPDATE SET "usage" = EXCLUDED."usage", "updated_at" = now();