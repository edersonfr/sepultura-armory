// Só no servidor (lê arquivos). Componentes de cliente importam ./macro-labels.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ClassMacroData } from "./macro-labels";

export * from "./macro-labels";

export interface MacroClass {
  slug: string; // rota: /macros/guerreiro
  dataSlug: string; // arquivo: src/data/macros/warrior.json
  name: string;
  classId: number;
}

export const MACRO_CLASSES: MacroClass[] = [
  { slug: "guerreiro", dataSlug: "warrior", name: "Guerreiro", classId: 1 },
  { slug: "paladino", dataSlug: "paladin", name: "Paladino", classId: 2 },
  { slug: "cacador", dataSlug: "hunter", name: "Caçador", classId: 3 },
  { slug: "ladino", dataSlug: "rogue", name: "Ladino", classId: 4 },
  { slug: "sacerdote", dataSlug: "priest", name: "Sacerdote", classId: 5 },
  { slug: "xama", dataSlug: "shaman", name: "Xamã", classId: 7 },
  { slug: "mago", dataSlug: "mage", name: "Mago", classId: 8 },
  { slug: "bruxo", dataSlug: "warlock", name: "Bruxo", classId: 9 },
  { slug: "druida", dataSlug: "druid", name: "Druida", classId: 11 },
];

const cache = new Map<string, ClassMacroData | null>();

/** Lê src/data/macros/<classe>.json (gerado por `npm run macros:fetch`). */
export function getClassMacros(dataSlug: string): ClassMacroData | null {
  if (cache.has(dataSlug)) return cache.get(dataSlug)!;
  let data: ClassMacroData | null = null;
  try {
    const file = path.join(process.cwd(), "src", "data", "macros", `${dataSlug}.json`);
    data = JSON.parse(readFileSync(file, "utf8")) as ClassMacroData;
  } catch {
    data = null; // arquivo ainda não gerado
  }
  cache.set(dataSlug, data);
  return data;
}

export const getMacroClass = (slug: string) => MACRO_CLASSES.find((c) => c.slug === slug);

export const countMacros = (d: ClassMacroData | null) =>
  d ? d.sections.reduce((n, s) => n + s.macros.length, 0) : 0;
