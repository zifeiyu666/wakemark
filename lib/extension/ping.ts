import {
  CHROME_EXTENSION_DEV_ID,
  CHROME_EXTENSION_STORE_ID,
} from "@/config/site";

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: unknown,
    responseCallback?: (response: unknown) => void
  ) => void;
  lastError?: { message?: string };
};

function getChromeRuntime(): ChromeRuntime | null {
  if (typeof window === "undefined") return null;
  const chromeObj = (
    window as unknown as { chrome?: { runtime?: ChromeRuntime } }
  ).chrome;
  return chromeObj?.runtime ?? null;
}

export async function pingExtensionHistoryImport(): Promise<boolean> {
  const runtime = getChromeRuntime();
  if (!runtime) return false;

  const ids = Array.from(
    new Set(
      [CHROME_EXTENSION_STORE_ID, CHROME_EXTENSION_DEV_ID].filter(Boolean)
    )
  );

  for (const id of ids) {
    const ok = await new Promise<boolean>((resolve) => {
      try {
        runtime.sendMessage(
          id,
          { type: "wakemark:start-history-import" },
          (response) => {
            if (runtime.lastError) {
              resolve(false);
              return;
            }
            resolve(
              !!response &&
                typeof response === "object" &&
                (response as { ok?: boolean }).ok === true
            );
          }
        );
      } catch {
        resolve(false);
      }
    });
    if (ok) return true;
  }
  return false;
}
