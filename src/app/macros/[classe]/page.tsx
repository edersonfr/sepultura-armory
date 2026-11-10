import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MACRO_CLASSES, countMacros, getClassMacros, getMacroClass } from "@/lib/macros";
import { WOW_CLASSES } from "@/lib/wow-constants";
import { MacroBrowser } from "@/components/MacroBrowser";
import { MacroClassTabs } from "@/components/MacroClassTabs";
import { MacroCredit } from "@/components/MacroCredit";

interface PageProps {
  params: Promise<{ classe: string }>;
}

export function generateStaticParams() {
  return MACRO_CLASSES.map((c) => ({ classe: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { classe } = await params;
  const c = getMacroClass(classe);
  return {
    title: c ? `Macros de ${c.name} • Sepultura Armory` : "Macros • Sepultura Armory",
    description: c ? `Macros de ${c.name} para PvE e PvP no World of Warcraft: Forever, prontas para copiar.` : undefined,
  };
}

export default async function MacroClassPage({ params }: PageProps) {
  const { classe } = await params;
  const c = getMacroClass(classe);
  if (!c) notFound();
  const info = WOW_CLASSES[c.classId];
  const data = getClassMacros(c.dataSlug);

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <div className="flex items-center gap-4">
          <img src={info?.icon} alt="" className="h-14 w-14 rounded-full border-2 object-cover" style={{ borderColor: info?.color }} />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-pedra">
              Macros{data ? ` · ${countMacros(data)}` : ""}
            </p>
            <h1 className="font-display text-4xl font-bold" style={{ color: info?.color }}>
              {c.name}
            </h1>
          </div>
        </div>
        <MacroClassTabs active={c.slug} />
      </header>

      {data ? (
        <MacroBrowser data={data} classColor={info?.color} />
      ) : (
        <div className="rounded-lg border border-dashed border-borda p-8 text-pedra">
          As macros de {c.name} ainda não foram importadas. Rode{" "}
          <code className="text-marfim">npm run macros:fetch -- {c.dataSlug}</code>.
        </div>
      )}

      <MacroCredit data={data} />
    </div>
  );
}
