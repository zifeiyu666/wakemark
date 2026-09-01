CREATE TABLE "bookmark_list_items" (
	"list_id" uuid NOT NULL,
	"bookmark_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_list_items_list_id_bookmark_id_pk" PRIMARY KEY("list_id","bookmark_id")
);
--> statement-breakpoint
CREATE TABLE "bookmark_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(60) NOT NULL,
	"slug" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_lists_user_id_slug_unique" UNIQUE("user_id","slug")
);
--> statement-breakpoint
ALTER TABLE "bookmark_list_items" ADD CONSTRAINT "bookmark_list_items_list_id_bookmark_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."bookmark_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_list_items" ADD CONSTRAINT "bookmark_list_items_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_lists" ADD CONSTRAINT "bookmark_lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookmark_list_items_bookmark_id" ON "bookmark_list_items" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "idx_bookmark_lists_user_id" ON "bookmark_lists" USING btree ("user_id");