export const EXTENSION_CLIENTS = {
  chrome: {
    purpose: "chrome-extension",
    keyName: "Chrome Extension",
  },
  raycast: {
    purpose: "raycast-extension",
    keyName: "Raycast Extension",
  },
} as const;

export type ExtensionClient = keyof typeof EXTENSION_CLIENTS;

