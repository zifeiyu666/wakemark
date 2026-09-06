"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = "granting" | "done" | "error";

export function ExtensionConnectClient() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const [status, setStatus] = useState<Status>("granting");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!state || !/^[0-9a-f-]{36}$/i.test(state)) {
      setStatus("error");
      setError("Missing or invalid connection state. Re-open the extension and try again.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/extension/auth/grant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ state }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          setStatus("error");
          setError(json.error || "Failed to connect the extension.");
          return;
        }
        setStatus("done");
        // Notify content script / opener if present (optional acceleration).
        try {
          window.postMessage(
            { type: "wakemark-extension-granted", state },
            window.location.origin
          );
        } catch {
          // ignore
        }
      } catch {
        setStatus("error");
        setError("Network error while connecting the extension.");
      }
    })();
  }, [state]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {status === "granting" && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <h1 className="text-xl font-semibold">Connecting WakeMark extension…</h1>
          <p className="text-sm text-muted-foreground">
            Keep this tab open. The extension will finish signing in automatically.
          </p>
        </>
      )}
      {status === "done" && (
        <>
          <h1 className="text-xl font-semibold">Extension connected</h1>
          <p className="text-sm text-muted-foreground">
            You can close this tab and return to the WakeMark extension.
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-xl font-semibold">Connection failed</h1>
          <p className="text-sm text-destructive">{error}</p>
        </>
      )}
    </div>
  );
}
