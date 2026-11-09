import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DISCORD_URL } from "@/lib/site";
import { DiscordIcon } from "./DiscordIcon";

const navLink =
  "rounded px-3 py-2 text-sm font-medium text-pedra transition hover:text-marfim";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-onix/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <img
            src="/brand/sepultura-emblema-nav.webp"
            alt=""
            width={44}
            height={53}
            className="h-[53px] w-auto"
          />
          <div className="leading-tight">
            <span className="font-display text-xl font-bold tracking-[0.12em] text-marfim transition group-hover:text-white">
              Sepultura
            </span>
            <p className="text-[11px] uppercase tracking-[0.18em] text-pedra">
              Armory · Horda
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/#membros" className={navLink}>
            Membros
          </Link>
          <Link href="/#top-10" className={`${navLink} hidden sm:block`}>
            Top 10
          </Link>
          <Link href="/talentos" className={navLink}>
            Talentos
          </Link>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord da guilda (abre em nova aba)"
            className="ml-1 inline-flex items-center gap-1.5 rounded border border-sangue bg-sangue px-3 py-2 text-xs font-semibold text-marfim transition hover:bg-sangue-hover"
          >
            <DiscordIcon className="h-4 w-4" />
            <span className="hidden md:inline">Discord</span>
          </a>
          <a
            href="https://worldofwarcraft.blizzard.com/pt-br/forever/us/armory/guild/sepultura"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1.5 rounded border border-borda bg-aco px-3 py-2 text-xs font-semibold text-marfim transition hover:border-pedra"
          >
            <span className="hidden md:inline">Armory oficial</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
