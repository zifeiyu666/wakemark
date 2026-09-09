# WakeMark Chrome Extension

Manifest V3 extension built with [WXT](https://wxt.dev) + React.

## Features

- Sign in via wakemark.app (no API key paste)
- One-click import of full X bookmark history (uses your x.com session, not the official API)
- Quick bookmark search in the toolbar popup
- Ask AI in the popup or Chrome side panel

## Environment

Site URL comes from `VITE_SITE_URL`:

| File | Used by | Default |
|------|---------|---------|
| [`.env.development`](.env.development) | `pnpm dev` | `http://localhost:3000` |
| [`.env.production`](.env.production) | `pnpm build` / `pnpm zip` | `https://wakemark.app` |
| `.env.local` | local override (gitignored) | — |

```bash
# one-off override
VITE_SITE_URL=http://localhost:3000 pnpm build
```

## Develop

```bash
# Terminal 1 — Next.js site (port 3000)
pnpm dev

# Terminal 2 — extension HMR (port 5173)
pnpm --dir extension install
pnpm --dir extension dev
```

Then open `chrome://extensions`, enable Developer mode, and **Load unpacked** → `extension/.output/chrome-mv3-dev`.

After changing `wxt.config.ts` or pulling updates, click **Reload** on the extension card in `chrome://extensions`.

Dev builds keep a stable ID (`key.b64`): `mlecdjaacmkbddpfddckfjhkchamjfco`, plus `http://localhost/*` and `x.com` host permission.

Optional on the site: `CHROME_EXTENSION_ID=mlecdjaacmkbddpfddckfjhkchamjfco`

### Import history testing

1. Sign in via the extension popup first.
2. Click **Import history** in the popup (not only from the website — Chrome requires the x.com permission prompt to come from the popup click).
3. Approve the **x.com access** permission when Chrome asks.
4. A `x.com/i/bookmarks` tab opens and scrolls automatically; keep it in the foreground.
5. Re-open the popup to watch `Importing… N new` progress. Errors show in red under the button.

## Chrome Web Store package

```bash
pnpm --dir extension zip
```

Upload the zip under `extension/.output/` (e.g. `wakemark-*.zip`).

Production builds are store-ready:

- no manifest `key` (Chrome assigns the public ID)
- no `localhost` host permission / content-script match
- `VITE_SITE_URL=https://wakemark.app`

After publishing, set the site env to the **store-assigned** extension ID:

```bash
CHROME_EXTENSION_ID=<id-from-chrome-web-store>
```

## Production build (unpacked)

```bash
pnpm --dir extension build
# Output: extension/.output/chrome-mv3
```
