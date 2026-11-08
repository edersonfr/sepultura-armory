/**
 * Regras da calculadora de talentos (sem dados), seguras para o cliente.
 * Dados: Talents Forever (https://talentsforever.com/), CC BY 4.0.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface Talent {
  name: string;
  row: number; // 1..7
  col: number; // 1..4
  max: number;
  icon: string;
  passive: boolean;
  desc: string[]; // texto de cada rank
  req: string | null; // nome do pré-requisito (mesma árvore)
  cost: string | null;
  hotfix: string | null;
  classic: { status?: "same" | "changed" | "moved" | "new"; text?: string; note?: string } | null;
  /** Tradução pt-BR (textos oficiais do cliente); null = usar o original */
  namePt?: string | null;
  descPt?: Array<string | null>;
}

export interface TalentTree {
  name: string;
  namePt?: string | null;
  icon: string;
  talents: Talent[];
  removed: Array<{ name: string; max: number; text: string; row?: number }>;
}

export interface ClassTalentData {
  slug: string; // slug em inglês dos dados (warrior)
  class: string;
  icon: string;
  generated: string;
  build: string | null;
  attribution: {
    text: string;
    url: string;
    license: string;
    licenseUrl: string;
  };
  trees: TalentTree[];
}

/** pontos[árvore][índice do talento] */
export type Build = number[][];

// ---------------------------------------------------------------------------
// Constantes do sistema de talentos (WoW: Forever, nível 60)
// ---------------------------------------------------------------------------

export const MAX_POINTS = 51;
export const POINTS_PER_ROW = 5;
export const FIRST_TALENT_LEVEL = 10;
export const ROWS = 7;
export const COLS = 4;

export const iconUrl = (icon: string) =>
  `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;

export const TREE_NAMES_PT: Record<string, string> = {
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
  "Feral Combat": "Combate Feral",
};

export const treeNamePt = (name: string) => TREE_NAMES_PT[name] ?? name;

/** Nome do talento para exibição (pt-BR quando houver). */
export const talentName = (t: Talent) => t.namePt || t.name;

/** Descrição do rank (1-based) e se veio da tradução. */
export function talentDesc(t: Talent, rank: number): { text: string; translated: boolean } | null {
  const i = rank - 1;
  const pt = t.descPt?.[i];
  if (pt) return { text: pt, translated: true };
  const en = t.desc[i];
  return en ? { text: en, translated: false } : null;
}

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

export const emptyBuild = (data: ClassTalentData): Build =>
  data.trees.map((t) => t.talents.map(() => 0));

export const treePoints = (build: Build, tree: number) =>
  build[tree].reduce((a, b) => a + b, 0);

export const totalPoints = (build: Build) =>
  build.reduce((sum, _t, i) => sum + treePoints(build, i), 0);

/** Nível mínimo para a quantidade de pontos (1º ponto no nível 10). */
export const requiredLevel = (points: number) =>
  points === 0 ? 0 : FIRST_TALENT_LEVEL - 1 + points;

/** Pontos gastos na árvore em linhas anteriores à linha informada. */
function pointsBeforeRow(data: ClassTalentData, build: Build, tree: number, row: number) {
  return data.trees[tree].talents.reduce(
    (sum, t, i) => (t.row < row ? sum + build[tree][i] : sum),
    0
  );
}

export const rowRequirement = (row: number) => (row - 1) * POINTS_PER_ROW;

function findIndex(data: ClassTalentData, tree: number, name: string) {
  return data.trees[tree].talents.findIndex((t) => t.name === name);
}

export type LockReason =
  | { kind: "row"; needed: number }
  | { kind: "req"; name: string; max: number }
  | { kind: "points" };

/** Por que não dá para adicionar um ponto (null = pode adicionar). */
export function addBlocker(
  data: ClassTalentData,
  build: Build,
  tree: number,
  index: number
): LockReason | null {
  const talent = data.trees[tree].talents[index];
  const needed = rowRequirement(talent.row);
  if (pointsBeforeRow(data, build, tree, talent.row) < needed) return { kind: "row", needed };
  if (talent.req) {
    const ri = findIndex(data, tree, talent.req);
    const reqTalent = data.trees[tree].talents[ri];
    if (ri >= 0 && build[tree][ri] < reqTalent.max) {
      return { kind: "req", name: talent.req, max: reqTalent.max };
    }
  }
  if (totalPoints(build) >= MAX_POINTS) return { kind: "points" };
  return null;
}

/** A árvore continua válida? (linhas desbloqueadas e pré-requisitos completos) */
function treeIsValid(data: ClassTalentData, build: Build, tree: number) {
  const talents = data.trees[tree].talents;
  return talents.every((t, i) => {
    if (build[tree][i] === 0) return true;
    if (pointsBeforeRow(data, build, tree, t.row) < rowRequirement(t.row)) return false;
    if (t.req) {
      const ri = findIndex(data, tree, t.req);
      if (ri >= 0 && build[tree][ri] < talents[ri].max) return false;
    }
    return true;
  });
}

export function canAdd(data: ClassTalentData, build: Build, tree: number, index: number) {
  const talent = data.trees[tree].talents[index];
  return build[tree][index] < talent.max && addBlocker(data, build, tree, index) === null;
}

export function canRemove(data: ClassTalentData, build: Build, tree: number, index: number) {
  if (build[tree][index] === 0) return false;
  const next = build.map((t) => [...t]);
  next[tree][index] -= 1;
  return treeIsValid(data, next, tree);
}

export function addPoint(data: ClassTalentData, build: Build, tree: number, index: number): Build {
  if (!canAdd(data, build, tree, index)) return build;
  const next = build.map((t) => [...t]);
  next[tree][index] += 1;
  return next;
}

export function removePoint(data: ClassTalentData, build: Build, tree: number, index: number): Build {
  if (!canRemove(data, build, tree, index)) return build;
  const next = build.map((t) => [...t]);
  next[tree][index] -= 1;
  return next;
}

export function resetTree(build: Build, tree: number): Build {
  return build.map((t, i) => (i === tree ? t.map(() => 0) : [...t]));
}

// ---------------------------------------------------------------------------
// Link compartilhável: ?b=<árvore1>-<árvore2>-<árvore3>
// Cada árvore é um dígito por talento (ordem linha/coluna), sem zeros à direita.
// ---------------------------------------------------------------------------

export function encodeBuild(build: Build): string {
  const parts = build.map((t) => t.join("").replace(/0+$/, ""));
  return parts.every((p) => p === "") ? "" : parts.join("-").replace(/-+$/, "");
}

/** Decodifica e valida aplicando ponto a ponto (descarta o que for inválido). */
export function decodeBuild(data: ClassTalentData, code: string | null | undefined): Build {
  let build = emptyBuild(data);
  if (!code) return build;
  const parts = code.split("-");
  // aplica por linhas crescentes para respeitar desbloqueios e pré-requisitos
  const wanted: Array<{ tree: number; index: number; ranks: number; row: number }> = [];
  data.trees.forEach((tree, ti) => {
    const digits = parts[ti] ?? "";
    tree.talents.forEach((t, i) => {
      const n = Number(digits[i] ?? 0);
      if (Number.isFinite(n) && n > 0) wanted.push({ tree: ti, index: i, ranks: Math.min(n, t.max), row: t.row });
    });
  });
  wanted.sort((a, b) => a.row - b.row);
  // algumas passadas resolvem pré-requisitos na mesma linha
  for (let pass = 0; pass < 3; pass++) {
    for (const w of wanted) {
      while (build[w.tree][w.index] < w.ranks && canAdd(data, build, w.tree, w.index)) {
        build = addPoint(data, build, w.tree, w.index);
      }
    }
  }
  return build;
}
