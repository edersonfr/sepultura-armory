import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TALENT_CLASSES, getTalentClass } from "@/lib/talents";
import { WOW_CLASSES } from "@/lib/wow-constants";
import { TalentCalculator } from "@/components/TalentCalculator";
import { TalentClassTabs } from "@/components/TalentClassTabs";
import { TalentCredit } from "@/components/TalentCredit";

interface PageProps {
  params: Promise<{ classe: string }>;
}

export function generateStaticParams() {
  return TALENT_CLASSES.map((c) => ({ classe: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { classe } = await params;
  const c = getTalentClass(classe);
  return {
    title: c ? `Talentos de ${c.name} • Sepultura Armory` : "Calculadora de talentos • Sepultura Armory",
    description: c ? `Calculadora de talentos de ${c.name} do World of Warcraft: Forever.` : undefined,
  };
}

export default async function TalentClassPage({ params }: PageProps) {
  const { classe } = await params;
  const c = getTalentClass(classe);
  if (!c) notFound();
  const info = WOW_CLASSES[c.classId];

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <div className="flex items-center gap-4">
          <img
            src={info?.icon}
            alt=""
            className="h-14 w-14 rounded-full border-2 object-cover"
            style={{ borderColor: info?.color }}
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-pedra">Calculadora de talentos</p>
            <h1 className="font-display text-4xl font-bold" style={{ color: info?.color }}>
              {c.name}
            </h1>
          </div>
        </div>
        <TalentClassTabs active={c.slug} />
      </header>

      <TalentCalculator data={c.data} classLabel={c.name} />

      <TalentCredit data={c.data} />
    </div>
  );
}
