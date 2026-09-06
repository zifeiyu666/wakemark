# WakeMark Chrome Extension

Manifest V3 extension built with [WXT](https://wxt.dev) + React.

## Features

- Sign in via wakemark.app (no API key paste)
- Quick bookmark search in the toolbar popup
- Ask AI in the popup or Chrome side panel

## Develop

```bash
# Terminal 1 — Next.js site
pnpm dev

# Terminal 2 — extension
pnpm --dir extension install
pnpm --dir extension dev
```

Then open `chrome://extensions`, enable Developer mode, and **Load unpacked** → `extension/.output/chrome-mv3-dev`.

Stable extension ID (from `key.pem` / `key.b64`): `mlecdjaacmkbddpfddckfjhkchamjfco`

Optional: set `CHROME_EXTENSION_ID=mlecdjaacmkbddpfddckfjhkchamjfco` in the site `.env`.

Default API base is `http://localhost:3000`. Override in the extension by setting `VITE_SITE_URL` when building, or change `SITE_URL` in `lib/config.ts`.

## Production build

```bash
pnpm --dir extension build
# Output: extension/.output/chrome-mv3
```
