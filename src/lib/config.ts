export const PANTA_API = "https://live-api.panta.market/api/v1";
export const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
export const PANTA_SITE = "https://www.panta.market";
export const SOLSCAN_TX = "https://solscan.io/tx/";

export const CATEGORIES = [
  "crypto",
  "sports",
  "entertainment",
  "politics",
  "finance",
  "science",
  "world",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];
