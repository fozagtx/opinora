import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BuyPanel from "@/components/BuyPanel";
import SharePanel from "@/components/SharePanel";
import { getMarket, getTrades, PantaError } from "@/lib/panta";
import { marketOdds, usd, when, ago, short, phaseLabel, bettingOpen, volume } from "@/lib/format";
import { SOLSCAN_TX } from "@/lib/config";

async function load(id: string) {
  try {
    return await getMarket(id);
  } catch (e) {
    if (e instanceof PantaError && (e.status === 404 || e.code === "MARKET_NOT_FOUND" || e.status === 400)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: PageProps<"/m/[id]">): Promise<Metadata> {
  const m = await load((await params).id);
  const o = marketOdds(m);
  return { title: `${m.title} | Opinora`, description: `YES ${o.yes}% · NO ${o.no}%. Pick a side on Opinora.` };
}

export default async function MarketPage({ params, searchParams }: PageProps<"/m/[id]">) {
  const { id } = await params;
  const isNew = (await searchParams).new === "1";
  const [m, trades] = await Promise.all([load(id), getTrades(id).catch(() => [])]);
  const o = marketOdds(m);
  const open = bettingOpen(m);
  const share = <SharePanel marketId={m.marketId} title={m.title} />;

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 pb-10 pt-10 md:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.images[0] && <img src={m.images[0]} alt="" className="h-20 w-20 shrink-0 rounded-2xl border-2 border-ink object-cover" />}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="chip !bg-sun">{m.category}</span>
              <span className="chip">{phaseLabel(m.phase, m.startTime)}</span>
            </div>
            <h1 className="font-display text-4xl uppercase leading-[0.95] sm:text-5xl">{m.title || "Untitled market"}</h1>
          </div>
        </div>

        <div className="panel flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div className="font-display text-6xl">{o.yes}%</div>
            <div className="mono text-sm uppercase">chance of yes</div>
          </div>
          <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
            <div className="h-full bg-ink" style={{ width: `${o.yes}%` }} />
          </div>
          <div className="mono grid grid-cols-3 gap-3 text-xs uppercase">
            <div className="flex flex-col gap-1"><span className="opacity-60">Volume</span><span className="text-base">{usd(volume(m))}</span></div>
            <div className="flex flex-col gap-1"><span className="opacity-60">Betting closes</span><span className="text-base">{when(m.startTime)}</span></div>
            <div className="flex flex-col gap-1"><span className="opacity-60">Resolves</span><span className="text-base">{when(m.resolutionTime)}</span></div>
          </div>
        </div>

        {m.description && (
          <div className="panel flex flex-col gap-2">
            <span className="label">Resolves YES if</span>
            <p>{m.description}</p>
            {m.oracle && (
              <a href={m.oracle.split(",")[0]} target="_blank" rel="noreferrer" className="mono text-sm underline break-all">{m.oracle.split(",")[0]}</a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl uppercase">Who&apos;s in</h2>
          {trades.length === 0 && <p className="mono text-sm">No bets yet. Be first.</p>}
          <div className="flex flex-col gap-2">
            {trades.map((t) => {
              const side = t.side ?? (Number(t.yesAmount) > 0 ? "yes" : "no");
              const shares = t.shares ? Number(t.shares) : Number(side === "yes" ? t.yesAmount : t.noAmount) / 1e6;
              return (
                <a key={t.signature} href={SOLSCAN_TX + t.signature} target="_blank" rel="noreferrer" className="mono flex items-center justify-between gap-3 rounded-full border-2 border-ink bg-white px-4 py-2 text-xs uppercase">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${side === "yes" ? "bg-ink" : "bg-no"}`} />
                    {short(t.wallet)} bought {side} · {shares.toFixed(2)} shares
                  </span>
                  <span className="opacity-60">{ago(t.blockTime)}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 md:sticky md:top-24 md:self-start">
        {isNew && share}
        <BuyPanel marketId={m.marketId} open={open} yes={o.yes} no={o.no} />
        {!isNew && share}
      </aside>
    </div>
  );
}
