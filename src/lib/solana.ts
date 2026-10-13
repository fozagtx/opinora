import "server-only";
import { Connection } from "@solana/web3.js";
import { SOLANA_RPC } from "./config";

export const connection = new Connection(SOLANA_RPC, "confirmed");

export async function sendAndConfirm(b64: string): Promise<string> {
  const raw = Buffer.from(b64, "base64");
  const signature = await connection.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 0 });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const s = value[0];
    if (s?.err) throw new Error(`Transaction failed on-chain: ${JSON.stringify(s.err)}`);
    if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) return signature;
    await connection.sendRawTransaction(raw, { skipPreflight: true, maxRetries: 0 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction was not confirmed in time. Check your wallet and try again.");
}
