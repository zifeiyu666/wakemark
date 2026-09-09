import { STORAGE_KEYS } from "./config";
import type { ImportStatus } from "./import-status";
import { idleImportStatus } from "./import-status";

const HUD_ID = "wakemark-import-hud";
let hudMounted = false;

function hudText(status: ImportStatus): string | null {
  if (status.status === "running") {
    return `Importing… ${status.inserted} new · ${status.skipped} skipped`;
  }
  if (status.status === "done" && !status.dismissed) {
    const total = status.inserted + status.skipped;
    const added =
      status.inserted > 0
        ? `${status.inserted} new`
        : "no new bookmarks";
    return `Import complete · ${added}${total > 0 ? ` (${total} processed)` : ""}`;
  }
  if (status.status === "error") {
    return status.error ?? "Import failed";
  }
  return null;
}

function ensureHud(): {
  root: HTMLDivElement;
  text: HTMLParagraphElement;
  hint: HTMLParagraphElement;
} {
  let root = document.getElementById(HUD_ID) as HTMLDivElement | null;
  if (root) {
    const shadow = root.shadowRoot;
    const text = shadow?.querySelector("[data-role=text]") as HTMLParagraphElement;
    const hint = shadow?.querySelector("[data-role=hint]") as HTMLParagraphElement;
    if (text && hint) return { root, text, hint };
  }

  root = document.createElement("div");
  root.id = HUD_ID;
  const shadow = root.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483646;
        max-width: min(360px, calc(100vw - 40px));
        padding: 12px 14px;
        border: 1px solid #333;
        background: #000;
        color: #fff;
        font: 12px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        box-shadow: 0 8px 28px rgba(0,0,0,.35);
      }
      .brand {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #a3a3a3;
        margin: 0 0 4px;
      }
      .text { margin: 0; font-weight: 600; }
      .hint { margin: 6px 0 0; color: #a3a3a3; font-size: 11px; }
      .text.error { color: #f87171; }
      .text.done { color: #4ade80; }
      .row { display: flex; align-items: flex-start; gap: 10px; }
      .close {
        margin-left: auto;
        border: none;
        background: transparent;
        color: #a3a3a3;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
      }
      .close:hover { color: #fff; }
    </style>
    <div class="wrap">
      <div class="row">
        <div style="min-width:0">
          <p class="brand">WakeMark</p>
          <p class="text" data-role="text"></p>
          <p class="hint" data-role="hint"></p>
        </div>
        <button type="button" class="close" data-role="close" aria-label="Dismiss">×</button>
      </div>
    </div>
  `;

  const text = shadow.querySelector("[data-role=text]") as HTMLParagraphElement;
  const hint = shadow.querySelector("[data-role=hint]") as HTMLParagraphElement;
  const close = shadow.querySelector("[data-role=close]") as HTMLButtonElement;

  close.addEventListener("click", () => {
    root?.remove();
  });

  document.body.appendChild(root);
  return { root, text, hint };
}

function renderHud(status: ImportStatus) {
  const message = hudText(status);
  const existing = document.getElementById(HUD_ID);
  if (!message) {
    existing?.remove();
    return;
  }

  const { text, hint } = ensureHud();
  text.textContent = message;
  text.className = "text";
  if (status.status === "error") text.classList.add("error");
  if (status.status === "done") text.classList.add("done");

  if (status.status === "running") {
    hint.textContent =
      "Auto-scrolling your bookmarks. Open the WakeMark side panel for full controls.";
  } else if (status.status === "done") {
    hint.textContent = "Refresh your WakeMark dashboard. Dismiss when finished.";
  } else {
    hint.textContent = "Check the WakeMark side panel for details.";
  }
}

export function mountImportHud() {
  if (hudMounted) {
    void chrome.storage.local.get(STORAGE_KEYS.importStatus).then((stored) => {
      const status =
        (stored[STORAGE_KEYS.importStatus] as ImportStatus | undefined) ??
        idleImportStatus;
      renderHud(status);
    });
    return;
  }
  hudMounted = true;

  const key = STORAGE_KEYS.importStatus;

  void chrome.storage.local.get(key).then((stored) => {
    const status = (stored[key] as ImportStatus | undefined) ?? idleImportStatus;
    renderHud(status);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[key]) return;
    const status =
      (changes[key].newValue as ImportStatus | undefined) ?? idleImportStatus;
    renderHud(status);
  });
}
