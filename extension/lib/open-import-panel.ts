const SIDE_PANEL_PATH = "sidepanel.html";

/** Open the WakeMark side panel on the bookmarks tab (or current window). */
export async function openImportSidePanel(tabId?: number): Promise<void> {
  try {
    if (tabId != null) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: SIDE_PANEL_PATH,
        enabled: true,
      });
      await chrome.sidePanel.open({ tabId });
      return;
    }

    const [active] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (active?.windowId != null) {
      await chrome.sidePanel.open({ windowId: active.windowId });
    }
  } catch {
    // May fail without user gesture or on older Chrome builds.
  }
}
