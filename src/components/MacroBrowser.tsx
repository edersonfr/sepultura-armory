"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { MacroCard } from "./MacroCard";
import { specNamePt, splitSectionName, type ClassMacroData } from "@/lib/macro-labels";

type View = "pve" | "pvp" | "all";
type Lang = "pt" | "en";
const LANG_KEY = "sepultura.macros.lang";

const seg = (active: boolean) =>
  `rounded px-3 py-1.5 text-xs font-semibold transition ${
    active ? "bg-sangue text-marfim" : "text-pedra hover:text-marfim"
  }`;

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function MacroBrowser({ data, classColor }: { data: ClassMacroData; classColor?: string }) {
  const [view, setView] = useState<View>("pve");
  const [spec, setSpec] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<Lang>(data.translated ? "pt" : "en");

  // Lembra o idioma do cliente escolhido (só neste navegador)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "pt" || saved === "en") setLang(data.translated ? saved : "en");
    } catch {}
  }, [data.translated]);
  const changeLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  };

  // Specs na ordem do site (Geral primeiro)
  const specs = useMemo(() => {
    const list: string[] = [];
    for (const s of data.sections) {
      const { spec } = splitSectionName(s.name);
      const base = spec === "Class-wide" ? "Class-wide" : spec;
      if (!list.includes(base)) list.push(base);
    }
    return list;
  }, [data.sections]);

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    return data.sections
      .map((s) => {
        const { spec: base, pvp } = splitSectionName(s.name);
        const specKey = base === "Class-wide" ? "Class-wide" : base;
        return { section: s, specKey, pvp };
      })
      .filter(({ section, specKey }) => (view === "all" || section.view === view) && (spec === "all" || spec === specKey))
      .map(({ section, specKey, pvp }) => ({
        id: section.id,
        title: `${specNamePt(specKey)}${pvp ? " · PvP" : ""}`,
        macros: q
          ? section.macros.filter((m) =>
              normalize([m.title, m.desc, m.code, m.codePt, m.needs].filter(Boolean).join(" ")).includes(q),
            )
          : section.macros,
      }))
      .filter((g) => g.macros.length);
  }, [data.sections, view, spec, query]);

  const shown = groups.reduce((n, g) => n + g.macros.length, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-borda bg-aco p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar macro</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pedra" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por habilidade, tecla ou texto (ex.: Investida, shift, mouseover)"
              className="w-full rounded border border-borda bg-onix py-2 pl-9 pr-9 text-sm text-marfim placeholder:text-pedra/70 focus:border-pedra focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-pedra hover:text-marfim"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Modo de jogo" className="inline-flex rounded border border-borda bg-onix p-0.5">
              {(["pve", "pvp", "all"] as View[]).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={seg(view === v)}>
                  {v === "pve" ? "PvE" : v === "pvp" ? "PvP" : "Todas"}
                </button>
              ))}
            </div>
            <div
              role="group"
              aria-label="Idioma do seu cliente do jogo"
              className="inline-flex items-center rounded border border-borda bg-onix p-0.5"
              title="As macros precisam estar no idioma do seu cliente do WoW"
            >
              <span className="px-2 text-[11px] uppercase tracking-wider text-pedra">Cliente</span>
              <button type="button" aria-pressed={lang === "pt"} disabled={!data.translated} onClick={() => changeLang("pt")} className={`${seg(lang === "pt")} disabled:opacity-40`}>
                PT-BR
              </button>
              <button type="button" aria-pressed={lang === "en"} onClick={() => changeLang("en")} className={seg(lang === "en")}>
                EN
              </button>
            </div>
          </div>
        </div>

        <div role="group" aria-label="Especialização" className="flex flex-wrap gap-2">
          {["all", ...specs].map((s) => {
            const active = spec === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setSpec(s)}
                className={`rounded border px-3 py-1.5 text-xs font-medium transition ${
                  active ? "bg-aco-alto text-marfim" : "border-borda text-pedra hover:border-pedra hover:text-marfim"
                }`}
                style={active ? { borderColor: classColor } : undefined}
              >
                {s === "all" ? "Todas as specs" : specNamePt(s)}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-pedra" aria-live="polite">
        {shown} {shown === 1 ? "macro" : "macros"}
        {lang === "pt" && data.translated && " · nomes de magias traduzidos automaticamente para o cliente em português: teste no jogo"}
      </p>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-borda p-10 text-center text-pedra">
          Nenhuma macro encontrada.{" "}
          <button type="button" className="text-marfim underline underline-offset-4" onClick={() => { setQuery(""); setSpec("all"); setView("all"); }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`sec-${g.id}`} className="space-y-3">
            <h2 id={`sec-${g.id}`} className="flex items-center gap-3 font-display text-xl font-bold text-marfim">
              <span className="h-5 w-[3px] rounded" style={{ background: classColor }} />
              {g.title}
              <span className="font-sans text-xs font-normal text-pedra">{g.macros.length}</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {g.macros.map((m) => (
                <MacroCard key={m.id} macro={m} lang={lang} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
