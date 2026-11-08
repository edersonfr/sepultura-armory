import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TALENT_CLASSES, treeNamePt } from "@/lib/talents";
import { WOW_CLASSES } from "@/lib/wow-constants";
import { TalentCredit } from "@/components/TalentCredit";

export const metadata: Metadata = {
  title: "Calculadora de talentos • Sepultura Armory",
  description: "Monte e compartilhe builds de talentos do World of Warcraft: Forever para as 9 classes.",
};

export default function TalentosPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-pedra">WoW: Forever · nível 60 · 51 pontos</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-marfim">Calculadora de talentos</h1>
        <div className="h-[3px] w-24 bg-sangue-vivo" />
        <p className="max-w-2xl text-pedra">Escolha a classe, distribua os pontos e compartilhe a build com a guilda pelo link.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TALENT_CLASSES.map((c) => {
          const info = WOW_CLASSES[c.classId];
          return (
            <Link
              key={c.slug}
              href={`/talentos/${c.slug}`}
              className="group flex items-center gap-4 rounded-lg border border-borda bg-aco p-4 transition hover:border-pedra hover:bg-aco-alto"
            >
              <img
                src={info?.icon}
                alt=""
                className="h-12 w-12 rounded-full border-2 object-cover"
                style={{ borderColor: info?.color }}
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold" style={{ color: info?.color }}>{c.name}</h2>
                <p className="truncate text-xs text-pedra">
                  {c.data.trees.map((t) => t.namePt || treeNamePt(t.name)).join(" · ")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-pedra transition group-hover:text-marfim" />
            </Link>
          );
        })}
      </div>

      <TalentCredit data={TALENT_CLASSES[0]?.data} />
    </div>
  );
}
