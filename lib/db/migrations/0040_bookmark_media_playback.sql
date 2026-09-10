ALTER TABLE "bookmarks" ADD COLUMN "media_playback_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;
