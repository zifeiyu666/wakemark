import { useCallback, useEffect, useState } from "react";
import {
  fetchMe,
  getStoredApiKey,
  getStoredUser,
  type ExtensionUser,
  validateStoredAuth,
} from "../lib/api";
import { STORAGE_KEYS } from "../lib/config";

export function useAuth() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [user, setUser] = useState<ExtensionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [key, storedUser] = await Promise.all([
      getStoredApiKey(),
      getStoredUser(),
    ]);
    setApiKey(key);
    setUser(key ? storedUser : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
      const ok = await validateStoredAuth();
      if (ok) {
        // Ensure avatar is present even for older logins without stored profile.
        try {
          const profile = await getStoredUser();
          if (!profile?.image) await fetchMe();
        } catch {
          // ignore
        }
      }
      await refresh();
    })();

    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") return;
      if (STORAGE_KEYS.apiKey in changes) {
        const next = changes[STORAGE_KEYS.apiKey].newValue;
        setApiKey(typeof next === "string" && next.trim() ? next : null);
        if (!next) setUser(null);
      }
      if (STORAGE_KEYS.user in changes) {
        const next = changes[STORAGE_KEYS.user].newValue as
          | ExtensionUser
          | undefined;
        setUser(next && typeof next.id === "string" ? next : null);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [refresh]);

  return { apiKey, user, signedIn: !!apiKey, loading, refresh };
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
