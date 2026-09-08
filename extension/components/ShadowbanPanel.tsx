import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  runShadowbanTestViaBackground,
  type CheckStatus,
  type ShadowbanCheck,
  type ShadowbanResult,
} from "../lib/shadowban";

function badgeTone(status: CheckStatus): "danger" | "ok" | "muted" {
  if (
    status === "detected" ||
    status === "flagged" ||
    status === "protected"
  ) {
    return "danger";
  }
  if (
    status === "not_detected" ||
    status === "not_flagged" ||
    status === "public"
  ) {
    return "ok";
  }
  return "muted";
}

function renderDescription(text: string, handle: string) {
  const needle = `from:@${handle}`;
  const idx = text.indexOf(needle);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <code className="sb-code">{needle}</code>
      {text.slice(idx + needle.length)}
    </>
  );
}

function CheckRow({
  check,
  handle,
}: {
  check: ShadowbanCheck;
  handle: string;
}) {
  const tone = badgeTone(check.status);
  return (
    <div className={`sb-check${tone === "danger" ? " sb-check-danger" : ""}`}>
      <div className="sb-check-head">
        <span className="sb-check-title">{check.title}</span>
        <span className={`sb-badge sb-badge-${tone}`}>
          <span className="sb-badge-icon" aria-hidden>
            {tone === "danger" ? "×" : tone === "ok" ? "✓" : "–"}
          </span>
          {check.label}
        </span>
      </div>
      <p className="sb-check-desc">
        {renderDescription(check.description, handle)}
      </p>
      {check.metric ? <span className="sb-metric">{check.metric}</span> : null}
    </div>
  );
}

export function ShadowbanPanel() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShadowbanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function onTest(e?: FormEvent) {
    e?.preventDefault();
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await runShadowbanTestViaBackground(handle);
      if (id !== requestId.current) return;
      setResult(data);
    } catch (err: unknown) {
      if (id !== requestId.current) return;
      setResult(null);
      setError(err instanceof Error ? err.message : "Shadowban test failed");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  const restrictionChecks = result?.checks.filter(
    (c) => c.id === "search_ban" || c.id === "suggestion_ban"
  );
  const settingChecks = result?.checks.filter(
    (c) => c.id === "sensitive" || c.id === "privacy"
  );

  return (
    <div className="col sb-panel">
      <form className="row sb-form" onSubmit={(e) => void onTest(e)}>
        <div className="sb-input-wrap">
          <span className="sb-at" aria-hidden>
            @
          </span>
          <input
            ref={inputRef}
            className="input sb-input"
            placeholder="username"
            value={handle}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !handle.trim()}
        >
          {loading ? "Testing…" : "Test"}
        </button>
      </form>

      <p className="muted sb-hint">
        Checks X search visibility from a logged-out guest session — not your
        own login.
      </p>

      {error ? <p className="danger sb-error">{error}</p> : null}

      {loading && !result ? (
        <p className="muted" style={{ textAlign: "center", marginTop: 24 }}>
          Running guest visibility checks…
        </p>
      ) : null}

      {result ? (
        <div className="scroll sb-results">
          <div className={`sb-summary sb-summary-${result.summary.tone}`}>
            <span className="sb-summary-dot" aria-hidden />
            <span>{result.summary.text}</span>
          </div>

          <div className="sb-section">
            {restrictionChecks?.map((check) => (
              <CheckRow key={check.id} check={check} handle={result.handle} />
            ))}
          </div>

          <div className="sb-divider" />

          <div className="sb-section">
            <div className="sb-section-label">Account settings</div>
            <p className="muted sb-section-note">
              These are your own profile settings, not restrictions X placed on
              you. They affect who can see your posts, and they explain why a
              test above may be unmeasurable.
            </p>
            {settingChecks?.map((check) => (
              <CheckRow key={check.id} check={check} handle={result.handle} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
