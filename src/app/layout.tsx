import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import { PANTA_SITE } from "@/lib/config";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const plex = IBM_Plex_Mono({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500"] });

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: "Opinora",
    description: "Turn your take into a prediction market and let your friends bet on it.",
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <header className="sticky top-0 z-20 px-4 pt-4">
            <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border-2 border-ink bg-white/90 py-2 pl-5 pr-2 backdrop-blur">
              <Link href="/" className="font-display text-2xl lowercase">opinora</Link>
              <div className="flex items-center gap-2">
                <Link href="/#create" className="chip hidden sm:inline-flex">New market</Link>
                <WalletButton />
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mono mx-auto flex w-full max-w-5xl justify-between px-6 py-10 text-xs uppercase">
            <span>opinora</span>
            <a href={PANTA_SITE} target="_blank" rel="noreferrer" className="underline">Powered by Panta</a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
