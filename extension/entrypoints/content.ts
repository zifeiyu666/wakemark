import { SITE_URL } from "../lib/config";

export default defineContentScript({
  matches: [
    "https://wakemark.app/*",
    "http://localhost:3000/*",
  ],
  runAt: "document_idle",
  main() {
    // Accelerate the poll loop when the connect page finishes granting.
    window.addEventListener("message", (event) => {
      if (event.origin !== SITE_URL && event.origin !== window.location.origin) {
        return;
      }
      const data = event.data as {
        type?: string;
        state?: string;
      } | null;
      if (data?.type === "wakemark-extension-granted" && data.state) {
        void chrome.runtime.sendMessage({
          type: "wakemark:auth-granted",
          state: data.state,
        });
      }
    });
  },
});
