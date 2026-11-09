import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DiscordIcon } from "@/components/DiscordIcon";
import { DISCORD_URL } from "@/lib/site";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEPULTURA • Guild Armory | World of Warcraft: Forever",
  description:
    "Armory privado da guilda Sepultura (Horda • US Normal) no World of Warcraft: Forever. Membros, equipamentos, atributos e talentos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`dark ${cinzel.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased selection:bg-sangue selection:text-marfim">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="mt-16 border-t border-borda bg-onix py-8 text-xs text-pedra">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              Guilda <span className="text-marfim">Sepultura</span> · World of
              Warcraft: Forever · US Normal · Horda
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-marfim underline-offset-4 transition hover:text-white hover:underline"
            >
              <DiscordIcon className="h-4 w-4" />
              Entre no Discord da guilda
            </a>
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-marfim">
              Sangue e Honra
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
