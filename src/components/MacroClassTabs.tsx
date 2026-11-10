import Link from "next/link";
import { MACRO_CLASSES } from "@/lib/macros";
import { WOW_CLASSES } from "@/lib/wow-constants";

/** Seletor das 9 classes na página de macros. */
export function MacroClassTabs({ active }: { active?: string }) {
  return (
    <nav aria-label="Classes" className="flex flex-wrap gap-2">
      {MACRO_CLASSES.map((c) => {
        const info = WOW_CLASSES[c.classId];
        const isActive = c.slug === active;
        return (
          <Link
            key={c.slug}
            href={`/macros/${c.slug}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 rounded border px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-aco-alto" : "border-borda bg-aco hover:border-pedra"
            }`}
            style={isActive ? { borderColor: info?.color } : undefined}
          >
            <img src={info?.icon} alt="" className="h-5 w-5 rounded-full" />
            <span style={{ color: info?.color }}>{c.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
