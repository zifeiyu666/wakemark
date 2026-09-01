// Shared JSON salvage helpers for LLM outputs. Models are asked to reply
// with bare JSON but occasionally wrap it in fences or get truncated at the
// token limit; these helpers recover as much as possible instead of failing.

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text;
  // Support both object ({...}) and array ([...]) payloads.
  const brace = candidate.indexOf("{");
  const bracket = candidate.indexOf("[");
  const starts = [brace, bracket].filter((i) => i !== -1);
  if (starts.length === 0) return candidate.trim();
  const start = Math.min(...starts);
  const end =
    start === brace
      ? candidate.lastIndexOf("}")
      : candidate.lastIndexOf("]");
  if (end <= start) return candidate.trim();
  return candidate.slice(start, end + 1);
}

// Salvage a batch payload truncated mid-JSON (finishReason=length): strip the
// dangling incomplete entry and close the wrappers so the already-complete
// entries survive, instead of losing the whole batch to a JSON.parse error.
export function repairTruncatedJson(text: string): string | null {
  const endsWithClose = text.trimEnd().endsWith("}");
  const suffixes = endsWithClose
    ? ["]}", "", "]}]", '"]}']
    : ["]}]", "]}", '"]}', '"]}'];
  for (const suffix of suffixes) {
    try {
      JSON.parse(text + suffix);
      return text + suffix;
    } catch {
      // try the next closing variant
    }
  }
  // Drop the dangling partial entry and retry once.
  const cut = Math.max(text.lastIndexOf("},"), text.lastIndexOf("}\n"));
  if (cut > 0) {
    const trimmed = text.slice(0, cut + 1);
    for (const suffix of ["]}", '"]}']) {
      try {
        JSON.parse(trimmed + suffix);
        return trimmed + suffix;
      } catch {
        // try the next closing variant
      }
    }
  }
  return null;
}
