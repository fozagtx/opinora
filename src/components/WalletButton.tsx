"use client";
import dynamic from "next/dynamic";

const Multi = dynamic(() => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton), {
  ssr: false,
  loading: () => <span className="wallet-adapter-button">Connect wallet</span>,
});

export default function WalletButton() {
  return <Multi />;
}
