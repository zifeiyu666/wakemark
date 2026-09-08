ALTER TABLE "user" ADD COLUMN "trial_ends_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "user" SET "trial_ends_at" = "created_at" + interval '7 days' WHERE "trial_ends_at" IS NULL;