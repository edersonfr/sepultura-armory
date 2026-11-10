import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MACRO_CLASSES, countMacros, getClassMacros } from "@/lib/macros";
import { WOW_CLASSES } from "@/lib/wow-constants";
import { MacroCredit } from "@/components/MacroCredit";

export const metadata: Metadata = {
  title: "Macros • Sepultura Armory",
  description: "Macros prontas para copiar, por classe e especialização, para o World of Warcraft: Forever.",
};

export default function MacrosPage() {
  const classes = MACRO_CLASSES.map((c) => {
    const data = getClassMacros(c.dataSlug);
    const pvp = data ? data.sections.filter((s) => s.view === "pvp").reduce((n, s) => n + s.macros.length, 0) : 0;
    return { ...c, data, total: countMacros(data), pvp };
  });
  const total = classes.reduce((n, c) => n + c.total, 0);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-pedra">
          WoW: Forever · {total ? `${total} macros` : "macros"} · PvE e PvP
        </p>
        <h1 className="font-display text-4xl font-bold text-marfim sm:text-5xl">Macros</h1>
        <div className="h-[3px] w-24 bg-sangue-vivo" />
        <p className="max-w-2xl text-pedra">
          Escolha a classe, copie a macro e cole no editor do jogo (<kbd className="rounded border border-borda bg-aco px-1 font-mono text-xs">/macro</kbd>).
          Com o cliente em português, o código já sai com os nomes das magias traduzidos.
        </p>
      </header>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-borda p-8 text-pedra">
          Nenhuma macro importada ainda. Rode <code className="text-marfim">npm run macros:fetch</code> na pasta do projeto.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const info = WOW_CLASSES[c.classId];
            return (
              <Link
                key={c.slug}
                href={`/macros/${c.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-borda bg-aco p-4 transition hover:border-pedra hover:bg-aco-alto"
              >
                <img src={info?.icon} alt="" className="h-12 w-12 rounded-full border-2 object-cover" style={{ borderColor: info?.color }} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold" style={{ color: info?.color }}>{c.name}</h2>
                  <p className="text-xs text-pedra">
                    {c.total} macros · {c.pvp} de PvP
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-pedra transition group-hover:text-marfim" />
              </Link>
            );
          })}
        </div>
      )}

      <MacroCredit data={classes.find((c) => c.data)?.data} />
    </div>
  );
}
