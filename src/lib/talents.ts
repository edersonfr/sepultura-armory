/**
 * Calculadora de talentos — dados e regras.
 *
 * Dados: Talents Forever (https://talentsforever.com/), CC BY 4.0.
 * Gerados por `npm run talents:fetch` em src/data/talents/<classe>.json.
 */
import warrior from "@/data/talents/warrior.json";
import paladin from "@/data/talents/paladin.json";
import hunter from "@/data/talents/hunter.json";
import rogue from "@/data/talents/rogue.json";
import priest from "@/data/talents/priest.json";
import shaman from "@/data/talents/shaman.json";
import mage from "@/data/talents/mage.json";
import warlock from "@/data/talents/warlock.json";
import druid from "@/data/talents/druid.json";

import type { ClassTalentData } from "./talent-rules";

export * from "./talent-rules";

// ---------------------------------------------------------------------------
// Classes (rotas em português)
// ---------------------------------------------------------------------------

export interface TalentClass {
  slug: string; // rota: /talentos/guerreiro
  dataSlug: string; // arquivo: warrior.json
  name: string;
  classId: number; // id da Blizzard, para cor/ícone em WOW_CLASSES
  data: ClassTalentData;
}

const raw: Record<string, unknown> = {
  warrior,
  paladin,
  hunter,
  rogue,
  priest,
  shaman,
  mage,
  warlock,
  druid,
};

const CLASS_DEFS: Array<Omit<TalentClass, "data">> = [
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

/** Ordena os talentos por linha/coluna para que o índice seja estável no link. */
function normalize(data: ClassTalentData): ClassTalentData {
  return {
    ...data,
    trees: data.trees.map((t) => ({
      ...t,
      talents: [...t.talents].sort((a, b) => a.row - b.row || a.col - b.col),
    })),
  };
}

export const TALENT_CLASSES: TalentClass[] = CLASS_DEFS.map((c) => ({
  ...c,
  data: normalize(raw[c.dataSlug] as ClassTalentData),
}));

export function getTalentClass(slug: string): TalentClass | undefined {
  return TALENT_CLASSES.find((c) => c.slug === slug);
}

