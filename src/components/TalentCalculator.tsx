"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link2, RotateCcw, Check, Minus, Plus, X } from "lucide-react";
import {
  type Build,
  type ClassTalentData,
  type Talent,
  MAX_POINTS,
  COLS,
  ROWS,
  addBlocker,
  addPoint,
  canAdd,
  canRemove,
  decodeBuild,
  emptyBuild,
  encodeBuild,
  iconUrl,
  removePoint,
  requiredLevel,
  resetTree,
  talentDesc,
  talentName,
  totalPoints,
  treeNamePt,
  treePoints,
} from "@/lib/talent-rules";

interface Props {
  data: ClassTalentData;
  classLabel: string;
}

// Geometria da grade (px): ícone de 44 + espaço de 16 → passo de 60
const CELL = 44;
const GAP = 16;
const STEP = CELL + GAP;
const GRID_W = COLS * STEP - GAP;
const GRID_H = ROWS * STEP - GAP;

interface Hover {
  tree: number;
  index: number;
  rect: DOMRect;
  pinned: boolean; // toque (mobile): tooltip fixo com botões
}

export function TalentCalculator({ data, classLabel }: Props) {
  const [build, setBuild] = useState<Build>(() => emptyBuild(data));
  const [hover, setHover] = useState<Hover | null>(null);
  const [copied, setCopied] = useState(false);
  const pointerType = useRef<string>("mouse");

  // Carrega a build do link (?b=...) no primeiro render do cliente
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("b");
    if (code) setBuild(decodeBuild(data, code));
  }, [data]);

  // Mantém o link sempre atualizado
  useEffect(() => {
    const code = encodeBuild(build);
    const url = new URL(window.location.href);
    if (code) url.searchParams.set("b", code);
    else url.searchParams.delete("b");
    window.history.replaceState(null, "", url.toString());
  }, [build]);

  const spent = totalPoints(build);
  const perTree = data.trees.map((_, i) => treePoints(build, i));
  const level = requiredLevel(spent);

  const add = useCallback((tree: number, index: number) => {
    setBuild((b) => addPoint(data, b, tree, index));
  }, [data]);
  const remove = useCallback((tree: number, index: number) => {
    setBuild((b) => removePoint(data, b, tree, index));
  }, [data]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  };

  // Fecha tooltip fixo ao tocar fora
  useEffect(() => {
    if (!hover?.pinned) return;
    const close = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-talent-cell]") && !el.closest("[data-talent-tooltip]")) setHover(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [hover?.pinned]);

  return (
    <div className="space-y-6">
      {/* Resumo e ações */}
      <div className="flex flex-col gap-4 rounded-lg border border-borda bg-aco p-5 lg:flex-row lg:items-center lg:justify-between">
        <dl className="grid grid-cols-3 gap-6 sm:flex sm:gap-10">
          <div>
            <dt className="text-xs text-pedra">Pontos</dt>
            <dd className="mt-1 text-2xl font-semibold text-marfim">
              {spent}
              <span className="text-sm font-normal text-pedra"> / {MAX_POINTS}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-pedra">Nível necessário</dt>
            <dd className="mt-1 text-2xl font-semibold text-marfim">{level || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-pedra">Distribuição</dt>
            <dd className="mt-1 text-2xl font-semibold text-marfim">{perTree.join(" / ")}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 hidden text-xs text-pedra-escura xl:block">
            Clique para aprender · clique direito ou Shift+clique para remover
          </p>
          <button
            type="button"
            onClick={copyLink}
            disabled={spent === 0}
            className="inline-flex h-10 items-center gap-2 rounded border border-borda bg-onix px-4 text-sm font-medium text-marfim transition hover:border-pedra disabled:cursor-not-allowed disabled:text-pedra-escura disabled:hover:border-borda"
          >
            {copied ? <Check className="h-4 w-4 text-vil" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Link copiado" : "Copiar link"}
          </button>
          <button
            type="button"
            onClick={() => setBuild(emptyBuild(data))}
            disabled={spent === 0}
            className="inline-flex h-10 items-center gap-2 rounded border border-sangue bg-sangue px-4 text-sm font-medium text-marfim transition hover:bg-sangue-hover disabled:cursor-not-allowed disabled:border-borda disabled:bg-desabilitado disabled:text-pedra-escura"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </button>
        </div>
      </div>

      {/* Árvores */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.trees.map((tree, ti) => (
          <section
            key={tree.name}
            className="rounded-lg border border-borda bg-aco"
            aria-label={`Árvore ${tree.namePt || treeNamePt(tree.name)}`}
          >
            <header className="flex items-center gap-3 border-b border-borda px-4 py-3">
              <img src={iconUrl(tree.icon)} alt="" className="h-9 w-9 rounded-full border border-borda" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold leading-tight text-marfim">
                  {tree.namePt || treeNamePt(tree.name)}
                </h2>
                <p className="text-[11px] uppercase tracking-[0.14em] text-pedra-escura">{tree.name}</p>
              </div>
              <span className="text-2xl font-semibold text-marfim">{perTree[ti]}</span>
              <button
                type="button"
                onClick={() => setBuild((b) => resetTree(b, ti))}
                disabled={perTree[ti] === 0}
                className="rounded p-1.5 text-pedra transition hover:bg-onix hover:text-marfim disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={`Resetar ${tree.namePt || treeNamePt(tree.name)}`}
                title="Resetar árvore"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </header>

            <div className="flex justify-center px-4 py-6">
              <div className="relative" style={{ width: GRID_W, height: GRID_H }}>
                <PrereqArrows talents={tree.talents} ranks={build[ti]} />
                {tree.talents.map((talent, index) => (
                  <TalentCell
                    key={talent.name}
                    talent={talent}
                    rank={build[ti][index]}
                    available={canAdd(data, build, ti, index)}
                    onAdd={() => add(ti, index)}
                    onRemove={() => remove(ti, index)}
                    onHover={(rect) => setHover((h) => (h?.pinned ? h : { tree: ti, index, rect, pinned: false }))}
                    onLeave={() => setHover((h) => (h?.pinned ? h : null))}
                    onPin={(rect) => setHover({ tree: ti, index, rect, pinned: true })}
                    pointerType={pointerType}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {hover && (
        <TalentTooltip
          data={data}
          build={build}
          hover={hover}
          onAdd={() => add(hover.tree, hover.index)}
          onRemove={() => remove(hover.tree, hover.index)}
          onClose={() => setHover(null)}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {classLabel}: {spent} de {MAX_POINTS} pontos, distribuição {perTree.join(", ")}.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function TalentCell({
  talent,
  rank,
  available,
  onAdd,
  onRemove,
  onHover,
  onLeave,
  onPin,
  pointerType,
}: {
  talent: Talent;
  rank: number;
  available: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onHover: (rect: DOMRect) => void;
  onLeave: () => void;
  onPin: (rect: DOMRect) => void;
  pointerType: { current: string };
}) {
  const maxed = rank >= talent.max;
  const active = rank > 0 || available;
  const state = maxed ? "max" : rank > 0 ? "partial" : available ? "available" : "locked";

  const border = {
    max: "border-marfim",
    partial: "border-vil",
    available: "border-vil/70",
    locked: "border-borda",
  }[state];

  const badge = {
    max: "text-marfim",
    partial: "text-vil",
    available: "text-vil",
    locked: "text-pedra-escura",
  }[state];

  return (
    <button
      type="button"
      data-talent-cell
      aria-label={`${talentName(talent)}, ${rank} de ${talent.max}`}
      className={`group absolute rounded border-2 bg-onix transition ${border} ${
        active ? "" : "cursor-default"
      } focus-visible:outline-offset-2`}
      style={{
        left: (talent.col - 1) * STEP,
        top: (talent.row - 1) * STEP,
        width: CELL,
        height: CELL,
      }}
      onPointerDown={(e) => {
        pointerType.current = e.pointerType;
      }}
      onMouseEnter={(e) => onHover(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(e.currentTarget.getBoundingClientRect())}
      onBlur={onLeave}
      onClick={(e) => {
        if (pointerType.current === "touch") {
          onPin(e.currentTarget.getBoundingClientRect());
          return;
        }
        if (e.shiftKey) onRemove();
        else onAdd();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onRemove();
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" || e.key === "Delete" || e.key === "-") {
          e.preventDefault();
          onRemove();
        }
        if (e.key === "+") {
          e.preventDefault();
          onAdd();
        }
      }}
    >
      <img
        src={iconUrl(talent.icon)}
        alt=""
        draggable={false}
        className={`h-full w-full rounded-[2px] object-cover transition ${
          state === "locked" ? "opacity-40 grayscale" : ""
        } ${active ? "group-hover:brightness-110" : ""}`}
      />
      <span
        className={`absolute -bottom-2 -right-2 min-w-[1.6rem] rounded border border-borda bg-onix px-1 text-center text-[10px] font-semibold leading-4 ${badge}`}
      >
        {rank}/{talent.max}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------

/** Setas de pré-requisito: do talento exigido até o dependente. */
function PrereqArrows({ talents, ranks }: { talents: Talent[]; ranks: number[] }) {
  const arrows = useMemo(() => {
    return talents
      .map((t, i) => {
        if (!t.req) return null;
        const ri = talents.findIndex((x) => x.name === t.req);
        if (ri < 0) return null;
        const from = talents[ri];
        const fx = (from.col - 1) * STEP + CELL / 2;
        const fy = (from.row - 1) * STEP + CELL / 2;
        const tx = (t.col - 1) * STEP + CELL / 2;
        const ty = (t.row - 1) * STEP;
        let d: string;
        if (from.col === t.col) {
          d = `M ${fx} ${fy + CELL / 2} L ${tx} ${ty - 4}`;
        } else if (from.row === t.row) {
          const dir = t.col > from.col ? 1 : -1;
          const y = fy;
          d = `M ${fx + (dir * CELL) / 2} ${y} L ${tx - dir * (CELL / 2 + 4)} ${y}`;
        } else {
          const dir = t.col > from.col ? 1 : -1;
          d = `M ${fx + (dir * CELL) / 2} ${fy} L ${tx} ${fy} L ${tx} ${ty - 4}`;
        }
        const met = ranks[ri] >= from.max;
        return { d, met, key: `${from.name}->${t.name}`, target: i };
      })
      .filter(Boolean) as Array<{ d: string; met: boolean; key: string; target: number }>;
  }, [talents, ranks]);

  if (!arrows.length) return null;
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={GRID_W}
      height={GRID_H}
      aria-hidden="true"
    >
      <defs>
        <marker id="arrow-met" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="rgb(var(--color-marfim-presa-de-kodo))" />
        </marker>
        <marker id="arrow-unmet" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="rgb(var(--color-texto-desabilitado))" />
        </marker>
      </defs>
      {arrows.map((a) => (
        <path
          key={a.key}
          d={a.d}
          fill="none"
          strokeWidth={3}
          stroke={a.met ? "rgb(var(--color-marfim-presa-de-kodo))" : "rgb(var(--color-texto-desabilitado))"}
          markerEnd={`url(#${a.met ? "arrow-met" : "arrow-unmet"})`}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------

const CLASSIC_LABEL: Record<string, { text: string; cls: string }> = {
  new: { text: "Novo no Forever", cls: "border-vil/50 bg-vil-profundo text-vil" },
  changed: { text: "Alterado do Classic", cls: "border-borda bg-onix text-marfim" },
  moved: { text: "Mudou de posição", cls: "border-borda bg-onix text-pedra" },
};

function TalentTooltip({
  data,
  build,
  hover,
  onAdd,
  onRemove,
  onClose,
}: {
  data: ClassTalentData;
  build: Build;
  hover: Hover;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const tree = data.trees[hover.tree];
  const talent = tree.talents[hover.index];
  const rank = build[hover.tree][hover.index];
  const blocker = rank < talent.max ? addBlocker(data, build, hover.tree, hover.index) : null;
  const current = rank > 0 ? talentDesc(talent, rank) : null;
  const next = rank < talent.max ? talentDesc(talent, rank + 1) : null;
  const treeLabel = tree.namePt || treeNamePt(tree.name);
  const reqTalent = blocker?.kind === "req" ? tree.talents.find((t) => t.name === blocker.name) : undefined;
  const showOriginal = (current && !current.translated) || (next && !next.translated);
  const classic = talent.classic?.status ? CLASSIC_LABEL[talent.classic.status] : null;

  // Posiciona ao lado do ícone, sem sair da tela
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { rect } = hover;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = rect.right + 12;
    if (left + w > vw - 8) left = rect.left - w - 12;
    if (left < 8) left = Math.max(8, Math.min(vw - w - 8, rect.left + rect.width / 2 - w / 2));
    let top = rect.top;
    if (left === rect.right + 12 || left === rect.left - w - 12) {
      top = Math.min(Math.max(8, rect.top - 8), vh - h - 8);
    } else {
      top = rect.bottom + 12;
      if (top + h > vh - 8) top = Math.max(8, rect.top - h - 12);
    }
    setPos({ left, top });
  }, [hover, rank]);

  return (
    <div
      ref={ref}
      data-talent-tooltip
      role="tooltip"
      className={`fixed z-50 w-72 rounded-lg border border-borda bg-onix/95 p-4 text-sm shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur ${
        hover.pinned ? "" : "pointer-events-none"
      }`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-marfim">{talentName(talent)}</p>
          {talent.namePt && talent.namePt !== talent.name && (
            <p className="text-[11px] italic text-pedra-escura">{talent.name}</p>
          )}
          <p className="mt-0.5 text-xs text-pedra">
            Rank {rank}/{talent.max} · {treeLabel}
          </p>
        </div>
        {hover.pinned && (
          <button type="button" onClick={onClose} className="rounded p-1 text-pedra hover:text-marfim" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {(classic || talent.hotfix) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {classic && (
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${classic.cls}`}>
              {classic.text}
            </span>
          )}
          {talent.hotfix && (
            <span className="rounded border border-borda bg-onix px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-pedra">
              Hotfix {talent.hotfix.split("-").reverse().join("/")}
            </span>
          )}
        </div>
      )}

      {talent.cost && <p className="mt-2 text-xs text-pedra">{talent.cost.split(" | ").join(" · ")}</p>}

      {current && <p className="mt-3 whitespace-pre-line leading-relaxed text-marfim">{current.text}</p>}

      {next && (
        <div className="mt-3">
          {current && <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-pedra">Próximo rank</p>}
          <p className={`whitespace-pre-line leading-relaxed ${current ? "text-pedra" : "text-marfim"}`}>{next.text}</p>
        </div>
      )}

      {showOriginal && (
        <p className="mt-2 text-[10px] uppercase tracking-wider text-pedra-escura">Texto original em inglês</p>
      )}

      {blocker && (
        <p className="mt-3 text-xs text-sangue-claro">
          {blocker.kind === "row" && `Requer ${blocker.needed} pontos em ${treeLabel}.`}
          {blocker.kind === "req" &&
            `Requer ${blocker.max} ${blocker.max === 1 ? "ponto" : "pontos"} em ${reqTalent ? talentName(reqTalent) : blocker.name}.`}
          {blocker.kind === "points" && `Todos os ${MAX_POINTS} pontos já foram gastos.`}
        </p>
      )}

      {hover.pinned ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove(data, build, hover.tree, hover.index)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded border border-borda bg-aco text-marfim disabled:text-pedra-escura"
          >
            <Minus className="h-4 w-4" /> Remover
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={!canAdd(data, build, hover.tree, hover.index)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded border border-sangue bg-sangue text-marfim disabled:border-borda disabled:bg-desabilitado disabled:text-pedra-escura"
          >
            <Plus className="h-4 w-4" /> Aprender
          </button>
        </div>
      ) : (
        <p className="mt-3 border-t border-borda pt-2 text-[11px] text-pedra-escura">
          Clique para aprender · clique direito para remover
        </p>
      )}
    </div>
  );
}
