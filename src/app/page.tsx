import CreateForm from "@/components/CreateForm";
import MarketTile from "@/components/MarketTile";
import { getMarket, listMarkets, type Market } from "@/lib/panta";

async function withPrices(items: Market[]) {
  return Promise.all(items.map((m) => getMarket(m.marketId, 30).catch(() => m)));
}

export default async function Home() {
  const [mine, open] = await Promise.all([
    listMarkets({ createdBy: "me", limit: 12 }).then(withPrices).catch(() => [] as Market[]),
    listMarkets({ limit: 40 })
      .then((items) => items.filter((m) => m.title.trim() && m.phase !== "cancelled").sort((a, b) => Number(a.resolved) - Number(b.resolved)).slice(0, 9))
      .then(withPrices)
      .catch(() => [] as Market[]),
  ]);
  const hero = [...mine, ...open].slice(0, 3);
  const missingKey = !process.env.PANTA_API_KEY;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-4 pb-10 pt-14">
      {missingKey && <p className="mono rounded-2xl border-2 border-no bg-white px-4 py-3 text-sm text-no">Set PANTA_API_KEY to load markets.</p>}
      <section className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-5xl uppercase leading-[0.92] sm:text-7xl">Put your take on the line.</h1>
          <p className="max-w-md text-lg">
            Turn any opinion into a market, drop the link in your group chat, and let your friends bet YES or NO with USDC.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#create" className="btn-sun">Start a market</a>
            <a href="#live" className="btn-ghost">See live takes</a>
          </div>
        </div>
        <div className="relative mx-auto aspect-[1200/630] w-full max-w-md">
          {hero.map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.marketId}
              src={`/api/card/${m.marketId}`}
              alt=""
              className="absolute inset-0 w-full rounded-3xl border-2 border-ink shadow-[0_12px_0_#0e3b39]"
              style={{ transform: `translateY(${(hero.length - 1 - i) * -22}px) scale(${1 - (hero.length - 1 - i) * 0.06}) rotate(${(i - 1) * 2}deg)`, zIndex: i }}
            />
          ))}
        </div>
      </section>

      <section id="create" className="scroll-mt-28 flex flex-col gap-5">
        <h2 className="font-display text-4xl uppercase">Start a market</h2>
        <div className="panel !p-6 md:!p-8">
          <CreateForm />
        </div>
      </section>

      <section id="live" className="scroll-mt-28 flex flex-col gap-10">
        {mine.length > 0 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-4xl uppercase">Takes on Opinora</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((m) => <MarketTile key={m.marketId} m={m} />)}
            </div>
          </div>
        )}
        {open.length > 0 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-4xl uppercase">On Panta right now</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {open.map((m) => <MarketTile key={m.marketId} m={m} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
