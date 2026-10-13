"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CATEGORIES } from "@/lib/config";
import { post, fromBase64Tx, signAndSend, errText } from "@/lib/client";

type Quote = { createId: string; paymentUsdc: string; imageUrl: string; expiresAt: string };

const toInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const hours = (h: number) => new Date(Date.now() + h * 3600_000);

export default function CreateForm() {
  const router = useRouter();
  const { publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [question, setQuestion] = useState("");
  const [rule, setRule] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState<string>("crypto");
  const [closes, setCloses] = useState(toInput(hours(24)));
  const [resolves, setResolves] = useState(toInput(hours(48)));
  const [stage, setStage] = useState<"form" | "quoting" | "confirm" | "signing" | "publishing">("form");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = stage === "quoting" || stage === "signing" || stage === "publishing";

  async function prepare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!publicKey) return setVisible(true);
    const closesAt = Math.floor(new Date(closes).getTime() / 1000);
    const resolvesAt = Math.floor(new Date(resolves).getTime() / 1000);
    if (closesAt < Date.now() / 1000 + 3660) return setError("Betting has to stay open for at least an hour.");
    if (resolvesAt <= closesAt) return setError("The result date has to come after betting closes.");
    try {
      setStage("quoting");
      const q = await post<Quote>("/api/create/quote", {
        wallet: publicKey.toBase58(),
        question,
        rule,
        source,
        category,
        closesAt,
        resolvesAt,
      });
      setQuote(q);
      setStage("confirm");
    } catch (err) {
      setError(errText(err));
      setStage("form");
    }
  }

  async function publish() {
    if (!quote || !publicKey || !signTransaction) return;
    setError(null);
    try {
      setStage("signing");
      const b = await post<{ transaction: string }>("/api/create/build", { createId: quote.createId, wallet: publicKey.toBase58() });
      const signature = await signAndSend(signTransaction, fromBase64Tx(b.transaction));
      setStage("publishing");
      const r = await post<{ marketId: string }>("/api/create/register", { createId: quote.createId, signature });
      router.push(`/m/${r.marketId}?new=1`);
    } catch (err) {
      setError(errText(err));
      setStage("confirm");
    }
  }

  if (quote && stage !== "form" && stage !== "quoting") {
    return (
      <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={quote.imageUrl} alt="" className="w-full aspect-square rounded-3xl border-2 border-ink" />
        <div className="flex flex-col gap-4">
          <p className="font-display text-3xl uppercase leading-none">{question}</p>
          <div className="mono flex justify-between rounded-2xl bg-cream px-4 py-3 text-sm">
            <span>Creation fee</span>
            <span>{(Number(quote.paymentUsdc) / 1e6).toFixed(2)} USDC</span>
          </div>
          {error && <p className="mono text-sm text-no">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button onClick={publish} disabled={busy} className="btn-sun">
              {stage === "signing" ? "Approve in wallet…" : stage === "publishing" ? "Publishing…" : "Sign and publish"}
            </button>
            <button onClick={() => { setStage("form"); setQuote(null); }} disabled={busy} className="btn-ghost">
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={prepare} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="label">Your take</span>
        <textarea
          required
          maxLength={200}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will Arsenal finish above Man City this season?"
          className="field font-display text-2xl uppercase leading-tight resize-none"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button type="button" key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? "chip-on" : ""}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="label">Resolves YES if</span>
          <input required maxLength={600} value={rule} onChange={(e) => setRule(e.target.value)} placeholder="Arsenal ends the 2026/27 season with more points" className="field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="label">Source of truth</span>
          <input required type="url" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://www.premierleague.com/tables" className="field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="label">Betting closes</span>
          <input required type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} className="field" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="label">Result known by</span>
          <input required type="datetime-local" value={resolves} onChange={(e) => setResolves(e.target.value)} className="field" />
        </label>
      </div>
      {error && <p className="mono text-sm text-no">{error}</p>}
      <button type="submit" disabled={busy} className="btn-sun self-start">
        {!publicKey ? "Connect wallet to start" : stage === "quoting" ? "Making your card…" : "Create market"}
      </button>
    </form>
  );
}
