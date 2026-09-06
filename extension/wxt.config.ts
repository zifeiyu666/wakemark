import { defineConfig } from "wxt";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const key = readFileSync(resolve(__dirname, "key.b64"), "utf8").trim();

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "WakeMark",
    description: "Search your X bookmarks and ask AI — powered by WakeMark.",
    version: "0.1.0",
    // Stable extension ID: mlecdjaacmkbddpfddckfjhkchamjfco
    key,
    permissions: ["storage", "sidePanel", "tabs", "alarms"],
    host_permissions: [
      "https://wakemark.app/*",
      "http://localhost:3000/*",
    ],
    action: {
      default_title: "WakeMark",
    },
    icons: {
      16: "icon-16.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
  },
});
