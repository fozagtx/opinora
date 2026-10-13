export function pct(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined || price === "") return null;
  const n = Number(price);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function odds(yesPrice: string | null, noPrice: string | null) {
  const y = pct(yesPrice);
  const n = pct(noPrice);
  if (y === null && n === null) return { yes: 50, no: 50 };
  const yes = y ?? 100 - (n ?? 50);
  return { yes, no: 100 - yes };
}

export function usd(v: string | number | null | undefined): string {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "$0";
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n >= 100 ? 0 : 2)}`;
}

export function short(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}

export function when(unix: number): string {
  return new Date(unix * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ago(unix: number | null): string {
  if (!unix) return "";
  const s = Math.max(1, Math.floor(Date.now() / 1000 - unix));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function phaseLabel(phase: string, startTime: number): string {
  if (phase === "primary") return Date.now() / 1000 < startTime ? "Open" : "Closing";
  if (phase === "secondary") return "Closed";
  if (phase === "resolved") return "Resolved";
  return "Cancelled";
}

export function bettingOpen(m: { phase: string; startTime: number }): boolean {
  return m.phase === "primary" && Date.now() / 1000 < m.startTime;
}

type Priced = { yesPrice: string | null; noPrice: string | null; primaryYesPrice?: string | null; primaryNoPrice?: string | null; secondaryYesPrice?: string | null; secondaryNoPrice?: string | null };

export function marketOdds(m: Priced) {
  return odds(m.yesPrice ?? m.secondaryYesPrice ?? m.primaryYesPrice ?? null, m.noPrice ?? m.secondaryNoPrice ?? m.primaryNoPrice ?? null);
}

type Vol = { volumeUsdc?: string | number | null; totalVolumeUsdc?: string | number | null; primaryVolume?: number | null; secondaryVolume?: number | null };

export function volume(m: Vol): number {
  return Math.max(Number(m.volumeUsdc ?? 0), Number(m.totalVolumeUsdc ?? 0), Number(m.primaryVolume ?? 0) + Number(m.secondaryVolume ?? 0)) || 0;
}
