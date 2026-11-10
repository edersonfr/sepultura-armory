// Tipos e rótulos das macros — seguro para componentes de cliente.

export type MacroOrigin = "classic" | "adapted" | "forever";

export interface MacroKey {
  key: string | null;
  text: string | null;
}

export interface Macro {
  id: string;
  title: string;
  desc: string | null;
  icon: string;
  iconKind: "ability" | "class";
  code: string;
  codePt?: string;
  untranslated?: string[];
  origin: MacroOrigin;
  keys?: MacroKey[];
  needs?: string;
  level?: number | null;
}

export interface MacroSection {
  id: string;
  name: string;
  view: "pve" | "pvp";
  macros: Macro[];
}

export interface ClassMacroData {
  slug: string;
  fetched: string;
  reviewed: string | null;
  translated: boolean;
  attribution: { text: string; url: string; license: string; licenseUrl: string };
  sections: MacroSection[];
}

/** Limite de caracteres de uma macro no jogo. */
export const MACRO_CHAR_LIMIT = 255;

export const ORIGIN_LABELS: Record<MacroOrigin, { label: string; className: string }> = {
  classic: { label: "Como no Classic", className: "border-borda text-pedra" },
  adapted: { label: "Adaptada do Classic", className: "border-brasa/40 text-brasa" },
  forever: { label: "Nova no Forever", className: "border-vil/40 text-vil" },
};

const SPEC_PT: Record<string, string> = {
  "Class-wide": "Geral",
  Arms: "Armas",
  Fury: "Fúria",
  Protection: "Proteção",
  Holy: "Sagrado",
  Retribution: "Retribuição",
  "Beast Mastery": "Domínio das Feras",
  Marksmanship: "Precisão",
  Survival: "Sobrevivência",
  Assassination: "Assassinato",
  Combat: "Combate",
  Subtlety: "Subterfúgio",
  Discipline: "Disciplina",
  Shadow: "Sombra",
  Elemental: "Elemental",
  Enhancement: "Aperfeiçoamento",
  Restoration: "Restauração",
  Arcane: "Arcano",
  Fire: "Fogo",
  Frost: "Gelo",
  Affliction: "Suplício",
  Demonology: "Demonologia",
  Destruction: "Destruição",
  Balance: "Equilíbrio",
  Feral: "Feral",
  "Feral Combat": "Combate Feral",
};

/** "Arms PvP" → { spec: "Arms", pvp: true } */
export function splitSectionName(name: string): { spec: string; pvp: boolean } {
  const pvp = / PvP$/.test(name);
  return { spec: pvp ? name.replace(/ PvP$/, "") : name, pvp };
}

export const specNamePt = (spec: string) => SPEC_PT[spec] ?? spec;

export const KEY_LABELS: Record<string, string> = {
  Press: "Apertar",
  Click: "Clique",
  "Right-click": "Botão direito",
};
export const keyLabel = (k: string | null) => (k ? KEY_LABELS[k] ?? k : "");
