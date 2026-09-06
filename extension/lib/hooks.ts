import { useCallback, useEffect, useState } from "react";
import { getStoredApiKey } from "../lib/api";
import { STORAGE_KEYS } from "../lib/config";

export function useAuth() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const key = await getStoredApiKey();
    setApiKey(key);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes[STORAGE_KEYS.apiKey]) {
        setApiKey((changes[STORAGE_KEYS.apiKey].newValue as string) ?? null);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [refresh]);

  return { apiKey, signedIn: !!apiKey, loading, refresh };
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
