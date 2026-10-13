import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Market } from "./panta";
import { marketOdds, usd, volume } from "./format";

export const INK = "#0E3B39";
export const CREAM = "#F4F0E6";
export const SUN = "#F2EE6B";
export const NO = "#C8553D";

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 900; style: "normal" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/ArchivoBlack.ttf")),
    readFile(join(process.cwd(), "src/assets/IBMPlexMono-Medium.ttf")),
  ]).then(([black, mono]) => [
    { name: "Archivo Black", data: black, weight: 900, style: "normal" },
    { name: "Plex Mono", data: mono, weight: 400, style: "normal" },
  ]);
  return fonts;
}

function fit(text: string, base: number, len: number) {
  return text.length > len * 2 ? base * 0.62 : text.length > len ? base * 0.78 : base;
}

export async function questionImage(question: string, category: string) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: CREAM, padding: 72, fontFamily: "Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, color: INK }}>
          <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 40 }}>opinora</div>
          <div style={{ display: "flex", background: SUN, borderRadius: 999, padding: "10px 26px", textTransform: "uppercase" }}>{category}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: fit(question, 96, 60), lineHeight: 1.02, color: INK, textTransform: "uppercase", letterSpacing: -2 }}>
          {question}
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", flex: 1, justifyContent: "center", background: INK, color: CREAM, borderRadius: 28, padding: "30px 0", fontSize: 44, fontFamily: "Archivo Black" }}>YES</div>
          <div style={{ display: "flex", flex: 1, justifyContent: "center", background: "white", color: INK, border: `4px solid ${INK}`, borderRadius: 28, padding: "26px 0", fontSize: 44, fontFamily: "Archivo Black" }}>NO</div>
        </div>
      </div>
    ),
    { width: 1024, height: 1024, fonts: await loadFonts() },
  );
}

export async function marketCard(m: Market, size: { width: number; height: number }, headers?: Record<string, string>) {
  const o = marketOdds(m);
  const title = m.title || "Untitled market";
  const tall = size.height > size.width;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: CREAM, padding: tall ? 80 : 64, fontFamily: "Plex Mono", color: INK }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
          <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 38 }}>opinora</div>
          <div style={{ display: "flex", background: SUN, borderRadius: 999, padding: "8px 24px", textTransform: "uppercase" }}>{m.category}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: fit(title, tall ? 92 : 76, tall ? 60 : 48), lineHeight: 1.02, textTransform: "uppercase", letterSpacing: -2, maxWidth: "100%" }}>
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", height: 26, borderRadius: 999, overflow: "hidden", background: "white", border: `3px solid ${INK}` }}>
            <div style={{ display: "flex", width: `${o.yes}%`, background: INK }} />
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            <div style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", background: INK, color: CREAM, borderRadius: 26, padding: "22px 32px" }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 40 }}>YES</div>
              <div style={{ display: "flex", fontSize: 40 }}>{o.yes}%</div>
            </div>
            <div style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", background: "white", border: `3px solid ${INK}`, borderRadius: 26, padding: "19px 30px" }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 40 }}>NO</div>
              <div style={{ display: "flex", fontSize: 40 }}>{o.no}%</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, textTransform: "uppercase" }}>
            <div style={{ display: "flex" }}>{usd(volume(m))} traded</div>
            <div style={{ display: "flex" }}>Tap to pick a side</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await loadFonts(), headers },
  );
}
