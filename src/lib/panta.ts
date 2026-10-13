import "server-only";
import { PANTA_API } from "./config";

export class PantaError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function apiKey(): string {
  const key = process.env.PANTA_API_KEY;
  if (!key) throw new PantaError(500, "MISSING_API_KEY", "PANTA_API_KEY is not set");
  return key;
}

export async function panta<T>(
  path: string,
  opts: { method?: "GET" | "POST"; body?: unknown; query?: Record<string, string | number | undefined>; revalidate?: number } = {},
): Promise<T> {
  const url = new URL(`${PANTA_API}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      Accept: "application/json",
      "X-Api-Key": apiKey(),
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    ...(opts.revalidate ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const d = (data ?? {}) as { code?: string; message?: string; fields?: Record<string, string[]> };
    const fieldMsg = d.fields ? Object.entries(d.fields).map(([k, v]) => `${k}: ${v.join(", ")}`).join("; ") : "";
    throw new PantaError(res.status, d.code ?? `HTTP_${res.status}`, fieldMsg || d.message || `Panta request failed (${res.status})`);
  }
  return data as T;
}

export type Market = {
  marketId: string;
  category: string;
  title: string;
  description: string;
  images: string[];
  phase: "primary" | "secondary" | "resolved" | "cancelled";
  marketType: string;
  startTime: number;
  endTime: number;
  resolutionTime: number;
  resolved: boolean;
  status: string;
  volumeUsdc: string;
  createdByPartner: boolean;
  yesPrice: string | null;
  noPrice: string | null;
  primaryYesPrice?: string | null;
  primaryNoPrice?: string | null;
  secondaryYesPrice?: string | null;
  secondaryNoPrice?: string | null;
  creatorAddress?: string;
  oracle?: string;
};

export type Trade = {
  id: string | number;
  wallet: string;
  isPrimary: boolean;
  yesAmount: string | number;
  noAmount: string | number;
  feePaid: string | number;
  blockTime: number | null;
  signature: string;
  side?: "yes" | "no";
  shares?: string;
  kind?: string;
};

export const getMarket = (id: string, revalidate?: number) => panta<Market>(`/markets/${encodeURIComponent(id)}/`, { revalidate });

export const getTrades = (id: string, limit = 30) =>
  panta<{ items: Trade[] }>(`/markets/${encodeURIComponent(id)}/trades/`, { query: { limit } }).then((r) => r.items);

export const listMarkets = (query: Record<string, string | number>) =>
  panta<{ items: Market[] }>(`/markets/`, { query, revalidate: 30 }).then((r) => r.items);

export function errorResponse(e: unknown) {
  if (e instanceof PantaError) {
    return Response.json({ code: e.code, message: e.message }, { status: e.status >= 500 ? 502 : e.status });
  }
  const message = e instanceof Error ? e.message : "Something went wrong";
  return Response.json({ code: "INTERNAL", message }, { status: 500 });
}
