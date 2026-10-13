"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { post, fromInstructions, signAndSend, errText } from "@/lib/client";
import { SOLSCAN_TX } from "@/lib/config";

type Quote = { quoteId: string; shares: string; avgPrice: string; feeUsdc: string };
type Build = { orderId: string; recentBlockhash: string; instructions: Parameters<typeof fromInstructions>[0] };

export default function BuyPanel({ marketId, open, yes, no }: { marketId: string; open: boolean; yes: number; no: number }) {
  const router = useRouter();
  const { publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("5");
  const [quoted, setQuoted] = useState<{ key: string; q: Quote } | null>(null);
  const [stage, setStage] = useState<"idle" | "signing" | "confirming">("idle");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const wallet = publicKey?.toBase58();
  const price = (side === "yes" ? yes : no) / 100;
  const amt = Number(amount);

  const key = `${wallet}:${side}:${amount}`;
  const quote = quoted?.key === key ? quoted.q : null;

  useEffect(() => {
    if (!open || !wallet || !(amt > 0)) return;
    const t = setTimeout(() => {
      post<Quote>("/api/buy/quote", { wallet, marketId, side, amountUsdc: amount })
        .then((q) => { setQuoted({ key: `${wallet}:${side}:${amount}`, q }); setError(null); })
        .catch((e) => setError(errText(e)));
    }, 600);
    return () => clearTimeout(t);
  }, [open, wallet, marketId, side, amount, amt]);

  async function buy() {
    if (!publicKey || !signTransaction) return setVisible(true);
    setError(null);
    setDone(null);
    try {
      setStage("signing");
      const q = await post<Quote>("/api/buy/quote", { wallet, marketId, side, amountUsdc: amount });
      const b = await post<Build>("/api/buy/build", { quoteId: q.quoteId, wallet });
      const signature = await signAndSend(signTransaction, fromInstructions(b.instructions, publicKey, b.recentBlockhash));
      setStage("confirming");
      await post("/api/buy/submit", { orderId: b.orderId, signature, wallet, marketId, quoteId: q.quoteId });
      setDone(signature);
      router.refresh();
    } catch (e) {
      setError(errText(e));
    } finally {
      setStage("idle");
    }
  }

  if (!open) {
    return (
      <div className="panel">
        <p className="font-display text-2xl uppercase">Betting is closed</p>
      </div>
    );
  }

  const shares = quote ? Number(quote.shares) : price > 0 ? amt / price : 0;
  return (
    <div className="panel flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSide("yes")} className={`side ${side === "yes" ? "side-yes" : ""}`}>
          <span>Yes</span>
          <span className="mono">{yes}¢</span>
        </button>
        <button onClick={() => setSide("no")} className={`side ${side === "no" ? "side-no" : ""}`}>
          <span>No</span>
          <span className="mono">{no}¢</span>
        </button>
      </div>
      <label className="flex flex-col gap-2">
        <span className="label">Amount (USDC)</span>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="field mono text-2xl" />
      </label>
      <div className="flex gap-2">
        {["1", "5", "10", "25"].map((v) => (
          <button key={v} onClick={() => setAmount(v)} className={`chip ${amount === v ? "chip-on" : ""}`}>
            ${v}
          </button>
        ))}
      </div>
      <div className="mono flex flex-col gap-1 rounded-2xl bg-cream px-4 py-3 text-sm">
        <div className="flex justify-between"><span>Shares</span><span>{shares ? shares.toFixed(2) : "0"}</span></div>
        <div className="flex justify-between"><span>Pays if {side.toUpperCase()}</span><span>${shares ? shares.toFixed(2) : "0"}</span></div>
        {quote && <div className="flex justify-between"><span>Fee</span><span>${Number(quote.feeUsdc).toFixed(2)}</span></div>}
      </div>
      {error && <p className="mono text-sm text-no">{error}</p>}
      {done && (
        <a href={SOLSCAN_TX + done} target="_blank" rel="noreferrer" className="mono text-sm underline">
          You&apos;re in. View transaction
        </a>
      )}
      <button onClick={buy} disabled={stage !== "idle" || !(amt > 0)} className={side === "yes" ? "btn-ink" : "btn-no"}>
        {!publicKey ? "Connect wallet" : stage === "signing" ? "Approve in wallet…" : stage === "confirming" ? "Confirming…" : `Buy ${side.toUpperCase()} for $${amount || 0}`}
      </button>
    </div>
  );
}
