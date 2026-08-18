// Client-side API fetch helpers

export async function api<T = unknown>(
  path: string,
  opts?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = { ...(opts?.headers as Record<string, string> ?? {}) };
  let body = opts?.body;
  if (opts?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(path, { ...opts, headers, body, cache: "no-store" });
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    const msg = (data && (data as { error?: string }).error) || `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return (data as T) ?? (null as T);
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export function qs(params: Record<string, string | number | boolean | null | undefined | string[]>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) if (item != null && item !== "") sp.append(k, String(item));
    } else {
      sp.append(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
