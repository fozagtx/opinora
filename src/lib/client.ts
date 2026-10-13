"use client";
import { Buffer } from "buffer";
import { PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

export async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.code || `Request failed (${res.status})`);
  return data as T;
}

type Ix = { programId: string; data: string; accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[] };

export const fromBase64Tx = (b64: string) => VersionedTransaction.deserialize(Buffer.from(b64, "base64"));

export function fromInstructions(ixs: Ix[], payer: PublicKey, recentBlockhash: string) {
  const instructions = ixs.map(
    (ix) =>
      new TransactionInstruction({
        programId: new PublicKey(ix.programId),
        keys: ix.accounts.map((a) => ({ pubkey: new PublicKey(a.pubkey), isSigner: a.isSigner, isWritable: a.isWritable })),
        data: Buffer.from(ix.data, "base64"),
      }),
  );
  return new VersionedTransaction(new TransactionMessage({ payerKey: payer, recentBlockhash, instructions }).compileToV0Message());
}

export async function signAndSend(sign: (tx: VersionedTransaction) => Promise<VersionedTransaction>, tx: VersionedTransaction) {
  const signed = await sign(tx);
  const { signature } = await post<{ signature: string }>("/api/send", { transaction: Buffer.from(signed.serialize()).toString("base64") });
  return signature;
}

export function errText(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/user rejected|rejected the request/i.test(m)) return "You cancelled in your wallet.";
  if (/insufficient|0x1\b/i.test(m)) return "Not enough USDC or SOL in this wallet.";
  return m;
}
