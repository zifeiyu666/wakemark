import { defineConfig } from "wxt";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const key = readFileSync(resolve(__dirname, "key.b64"), "utf8").trim();

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  // Keep HMR off Next.js's default port 3000.
  dev: {
    server: {
      port: 5173,
    },
  },
  // Function form so we can branch on mode after .env files load.
  // - development (`pnpm dev`): keep stable key + localhost for local testing
  // - production (`pnpm build` / `pnpm zip`): store-ready (no key, no localhost)
  manifest: ({ mode }) => {
    const isDev = mode === "development";
    return {
      name: "WakeMark",
      description:
        "Search your X bookmarks and ask AI — powered by WakeMark.",
      version: "0.1.0",
      // Dev-only: pins unpacked ID to mlecdjaacmkbddpfddckfjhkchamjfco.
      // Chrome Web Store assigns the production ID — do not ship `key`.
      ...(isDev ? { key } : {}),
      permissions: ["storage", "sidePanel", "tabs", "alarms"],
      // Match patterns cannot include a port (localhost/*, not :3000).
      host_permissions: isDev
        ? ["https://wakemark.app/*", "http://localhost/*"]
        : ["https://wakemark.app/*"],
      action: {
        default_title: "WakeMark",
      },
      content_security_policy: {
        extension_pages: isDev
          ? "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; img-src 'self' data: https: http://localhost:* blob:;"
          : "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; img-src 'self' data: https: blob:;",
      },
      icons: {
        16: "icon-16.png",
        48: "icon-48.png",
        128: "icon-128.png",
      },
    };
  },
});
