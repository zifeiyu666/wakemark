# WakeMark Raycast extension

Companion to [wakemark.app](https://wakemark.app): search synced bookmarks and Ask AI from Raycast.

This is **not** a replacement for the Chrome extension. Full X bookmark history import still requires the browser session on `x.com`.

## Commands

- **Search Bookmarks** — query bookmarks already in your WakeMark account
- **Ask AI** — same `/api/extension/ask-ai` stream as the Chrome popup
- **Sign In** / **Sign Out** — browser login via `/extension/connect?client=raycast` (separate API key from Chrome)

## Develop

Raycast must be installed.

```bash
# Terminal 1 — Next.js site
pnpm dev

# Terminal 2
cd raycast
pnpm install
pnpm dev
```

In Raycast: **Import Extension** → this `raycast/` folder (if `ray develop` does not attach automatically).

For a local site, open the extension preferences and set **WakeMark URL** to `http://localhost:3000`.

## Store / author

`package.json` `author` must match your [Raycast](https://www.raycast.com) username before publishing to the store.
