"use client";
import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

export default function SharePanel({ marketId, title }: { marketId: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const url = origin ? `${origin}/m/${marketId}` : "";

  const text = `${title} Pick a side on Opinora:`;
  const enc = encodeURIComponent;
  const links = [
    { label: "X", href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
  ];

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function shareImage() {
    const blob = await (await fetch(`/api/card/${marketId}?format=story`)).blob();
    const file = new File([blob], "opinora.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, url }).catch(() => {});
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "opinora.png";
      a.click();
    }
  }

  return (
    <div className="panel flex flex-col gap-4">
      <p className="font-display text-2xl uppercase leading-none">Send it to the group chat</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/card/${marketId}`} alt="" className="w-full rounded-2xl border-2 border-ink" />
      <div className="flex items-center gap-2 rounded-full border-2 border-ink bg-white p-1 pl-4">
        <span className="mono truncate text-sm flex-1">{url.replace(/^https?:\/\//, "")}</span>
        <button onClick={copy} className="btn-ink !py-2 !px-4 text-sm">{copied ? "Copied" : "Copy link"}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="chip">
            {l.label}
          </a>
        ))}
        <button onClick={shareImage} className="chip">Save image</button>
      </div>
    </div>
  );
}
