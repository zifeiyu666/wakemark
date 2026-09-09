import { LOWER_CASE_SITE_NAME } from "@/lib/upstash/redis-keys";

export const REDIS_RATE_LIMIT_CONFIGS = {
  anonymousUpload: {
    prefix: `${LOWER_CASE_SITE_NAME}:rl:anonymous-upload`,
    maxRequests: 100,
    window: "1 d"
  },
  anonymousDownload: {
    prefix: `${LOWER_CASE_SITE_NAME}:rl:anonymous-download`,
    maxRequests: 100,
    window: "1 d"
  },
  newsletter: {
    prefix: `${LOWER_CASE_SITE_NAME}:rl:newsletter`,
    maxRequests: 10,
    window: "1 d",
  },
  askAi: {
    prefix: `${LOWER_CASE_SITE_NAME}:rl:ask-ai`,
    maxRequests: 30,
    window: "1 d",
  },
  extensionImport: {
    prefix: `${LOWER_CASE_SITE_NAME}:rl:extension-import`,
    maxRequests: 30,
    window: "1 m",
  },
  notionSync: {
    prefix: `${LOWER_CASE_SITE_NAME}:rl:notion-sync`,
    maxRequests: 20,
    window: "1 h",
  },
};