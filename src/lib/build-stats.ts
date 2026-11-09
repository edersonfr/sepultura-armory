/**
 * Builds populares da guilda — contador próprio, no estilo do Talents Forever.
 *
 * Como funciona:
 *  1. A calculadora envia eventos (planned / opened / shared) para
 *     /api/talentos/track com a build no formato do link (?b=...).
 *  2. Cada evento soma +1 num hash do Redis por classe e por dia:
 *       chave  talentos:<classe>:<AAAA-MM-DD>
 *       campo  <evento>:<build>
 *     Nada identifica quem montou a build: só contagens diárias.
 *  3. A página da classe soma os dias desde o último hotfix que mexeu nos
 *     talentos, filtra builds com 41+ pontos, agrupa as parecidas em
 *     "famílias" e calcula a divisão por árvore e o pick rate de cada talento.
 *
 * Armazenamento: Upstash Redis (Vercel → Storage → Marketplace → Upstash),
 * chamado pela API REST com fetch, sem dependência extra. Sem as variáveis de
 * ambiente, o tracking vira no-op e a seção de populares não aparece.
 *
 * Somente servidor.
 */
import type { Build, ClassTalentData } from "./talent-rules";
import { decodeBuild, encodeBuild, totalPoints, treePoints } from "./talent-rules";

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

export const EVENTS = ["planned", "opened", "shared"] as const;
export type BuildEvent = (typeof EVENTS)[number];

/** Só builds "de nível 60" entram na contagem (igual ao Talents Forever). */
export const MIN_POINTS = 41;
/** Builds a até N pontos de distância (mesma árvore principal) viram uma família. */
export const FAMILY_DISTANCE = 4;
/** Abaixo disso a seção não aparece (amostra pequena demais). */
export const MIN_BUILDS = 3;
/** Janela máxima, mesmo se não houver hotfix recente. */
const MAX_DAYS = 90;
/** Os dados expiram sozinhos depois disso. */
const TTL_SECONDS = 120 * 24 * 60 * 60;
/** Peso de cada evento no ranking. Compartilhar vale mais que abrir. */
const WEIGHT: Record<BuildEvent, number> = { planned: 1, opened: 1, shared: 2 };

/**
 * Força a data de corte de uma classe (AAAA-MM-DD), ex.: quando um patch
 * muda talentos e o JSON ainda não tem o campo hotfix atualizado.
 */
const CUTOFF_OVERRIDE: Record<string, string> = {
  // paladin: "2026-10-30",
};

// ---------------------------------------------------------------------------
// Redis (Upstash REST)
// ---------------------------------------------------------------------------

function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export const statsEnabled = () => redisEnv() !== null;

type Cmd = Array<string | number>;

async function pipeline(cmds: Cmd[], init?: { revalidate?: number }): Promise<unknown[] | null> {
  const env = redisEnv();
  if (!env || !cmds.length) return null;
  try {
    const res = await fetch(`${env.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds),
      ...(init?.revalidate ? { next: { revalidate: init.revalidate } } : { cache: "no-store" as const }),
    });
    if (!res.ok) return null;
    const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    return out.map((r) => r.result ?? null);
  } catch {
    return null;
  }
}

const dayKey = (cls: string, day: string) => `talentos:${cls}:${day}`;
const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

/**
 * Valida e grava um evento. A build é reconstruída pelas regras da
 * calculadora: se o código não sair idêntico, é inválido e é descartado.
 */
export async function recordEvent(
  cls: string,
  data: ClassTalentData,
  code: string,
  event: BuildEvent
): Promise<"ok" | "invalid" | "disabled"> {
  if (!redisEnv()) return "disabled";
  if (typeof code !== "string" || code.length > 120 || !/^[0-5-]+$/.test(code)) return "invalid";
  const canonical = encodeBuild(decodeBuild(data, code));
  if (!canonical || canonical !== code) return "invalid";

  const key = dayKey(cls, today());
  await pipeline([
    ["HINCRBY", key, `${event}:${canonical}`, 1],
    ["EXPIRE", key, TTL_SECONDS],
  ]);
  return "ok";
}

// ---------------------------------------------------------------------------
// Leitura e agregação
// ---------------------------------------------------------------------------

/** Último hotfix que mexeu nos talentos da classe (ou o override). */
export function classCutoff(cls: string, data: ClassTalentData): string {
  if (CUTOFF_OVERRIDE[cls]) return CUTOFF_OVERRIDE[cls];
  const dates = data.trees.flatMap((t) => t.talents.map((tal) => tal.hotfix)).filter(Boolean) as string[];
  const latest = dates.sort().at(-1);
  const floor = new Date(Date.now() - MAX_DAYS * 864e5).toISOString().slice(0, 10);
  return latest && latest > floor ? latest : floor;
}

function daysSince(from: string): string[] {
  const out: string[] = [];
  const end = today();
  for (let d = new Date(`${from}T00:00:00Z`); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const s = d.toISOString().slice(0, 10);
    out.push(s);
    if (s >= end || out.length > MAX_DAYS) break;
  }
  return out;
}

export interface BuildCount {
  code: string;
  planned: number;
  opened: number;
  shared: number;
}

/** Soma as contagens de todos os dias desde a data de corte. */
async function loadCounts(cls: string, since: string, revalidate: number): Promise<BuildCount[] | null> {
  const days = daysSince(since);
  const results = await pipeline(days.map((d) => ["HGETALL", dayKey(cls, d)]), { revalidate });
  if (!results) return null;

  const map = new Map<string, BuildCount>();
  for (const flat of results) {
    if (!Array.isArray(flat)) continue;
    for (let i = 0; i < flat.length; i += 2) {
      const field = String(flat[i]);
      const n = Number(flat[i + 1]) || 0;
      const sep = field.indexOf(":");
      const event = field.slice(0, sep) as BuildEvent;
      const code = field.slice(sep + 1);
      if (!EVENTS.includes(event)) continue;
      const row = map.get(code) ?? { code, planned: 0, opened: 0, shared: 0 };
      row[event] += n;
      map.set(code, row);
    }
  }
  return [...map.values()];
}

export interface Family {
  code: string; // build "líder" da família (a mais popular dentro dela)
  perTree: number[];
  mainTree: number;
  variants: number; // quantas builds diferentes caíram nessa família
  planned: number;
  opened: number;
  shared: number;
  score: number;
}

export interface PickRate {
  tree: number;
  index: number;
  rate: number; // 0..1
}

export interface PopularStats {
  since: string;
  totals: { planned: number; opened: number; shared: number; builds: number };
  treeShare: number[]; // 0..1 por árvore
  families: Family[];
  picks: PickRate[];
}

function distance(a: Build, b: Build) {
  let d = 0;
  a.forEach((tree, t) => tree.forEach((r, i) => (d += Math.abs(r - (b[t]?.[i] ?? 0)))));
  return d;
}

const scoreOf = (c: BuildCount) =>
  c.planned * WEIGHT.planned + c.opened * WEIGHT.opened + c.shared * WEIGHT.shared;

export function computePopular(data: ClassTalentData, counts: BuildCount[], since: string): PopularStats {
  // 1) decodifica e filtra as builds completas
  const builds = counts
    .map((c) => {
      const build = decodeBuild(data, c.code);
      const perTree = data.trees.map((_, i) => treePoints(build, i));
      return { ...c, build, perTree, mainTree: perTree.indexOf(Math.max(...perTree)), score: scoreOf(c) };
    })
    .filter((b) => totalPoints(b.build) >= MIN_POINTS && b.score > 0)
    .sort((a, b) => b.score - a.score);

  const totals = builds.reduce(
    (t, b) => ({ planned: t.planned + b.planned, opened: t.opened + b.opened, shared: t.shared + b.shared, builds: t.builds + 1 }),
    { planned: 0, opened: 0, shared: 0, builds: 0 }
  );
  const totalScore = builds.reduce((s, b) => s + b.score, 0) || 1;

  // 2) famílias: a build mais popular vira líder; parecidas entram nela
  const families: Array<Family & { leader: Build }> = [];
  for (const b of builds) {
    const fam = families.find((f) => f.mainTree === b.mainTree && distance(f.leader, b.build) <= FAMILY_DISTANCE);
    if (fam) {
      fam.variants += 1;
      fam.planned += b.planned;
      fam.opened += b.opened;
      fam.shared += b.shared;
      fam.score += b.score;
    } else {
      families.push({
        code: b.code,
        leader: b.build,
        perTree: b.perTree,
        mainTree: b.mainTree,
        variants: 1,
        planned: b.planned,
        opened: b.opened,
        shared: b.shared,
        score: b.score,
      });
    }
  }
  families.sort((a, b) => b.score - a.score);

  // 3) divisão por árvore principal
  const treeShare = data.trees.map(
    (_, t) => builds.filter((b) => b.mainTree === t).reduce((s, b) => s + b.score, 0) / totalScore
  );

  // 4) pick rate: % (ponderado) das builds com ao menos 1 ponto no talento
  const picks: PickRate[] = [];
  data.trees.forEach((tree, t) =>
    tree.talents.forEach((_, i) => {
      const with_ = builds.filter((b) => b.build[t][i] > 0).reduce((s, b) => s + b.score, 0);
      picks.push({ tree: t, index: i, rate: with_ / totalScore });
    })
  );

  return {
    since,
    totals,
    treeShare,
    families: families.slice(0, 5).map(({ leader: _leader, ...f }) => f),
    picks,
  };
}

/** Tudo pronto para a página. null = desligado, sem dados ou amostra pequena. */
export async function getPopularStats(
  cls: string,
  data: ClassTalentData,
  revalidate: number
): Promise<PopularStats | null> {
  if (!redisEnv()) return null;
  const since = classCutoff(cls, data);
  const counts = await loadCounts(cls, since, revalidate);
  if (!counts) return null;
  const stats = computePopular(data, counts, since);
  return stats.totals.builds >= MIN_BUILDS ? stats : null;
}
