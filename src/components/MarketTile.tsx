import Link from "next/link";
import type { Market } from "@/lib/panta";
import { marketOdds, usd, phaseLabel, volume } from "@/lib/format";

export default function MarketTile({ m }: { m: Market }) {
  const o = marketOdds(m);
  return (
    <Link href={`/m/${m.marketId}`} className="panel flex flex-col gap-4 transition-transform hover:-translate-y-1">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {m.images[0] && <img src={m.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover border-2 border-ink" />}
        <p className="font-display text-lg uppercase leading-tight line-clamp-3">{m.title || "Untitled market"}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
          <div className="h-full bg-ink" style={{ width: `${o.yes}%` }} />
        </div>
        <div className="mono flex justify-between text-xs uppercase">
          <span>Yes {o.yes}% · No {o.no}%</span>
          <span>{usd(volume(m))} · {phaseLabel(m.phase, m.startTime)}</span>
        </div>
      </div>
    </Link>
  );
}
