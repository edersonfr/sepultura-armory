"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown, ChevronRight } from "lucide-react";
import type { GuildMemberEnriched } from "@/lib/blizzard";
import { WOW_CLASSES } from "@/lib/wow-constants";

interface Props {
  members: GuildMemberEnriched[];
}

const chip = (active: boolean) =>
  `rounded border px-3 py-1.5 text-xs font-medium transition ${
    active
      ? "border-sangue bg-sangue text-marfim"
      : "border-borda bg-onix text-pedra hover:border-pedra hover:text-marfim"
  }`;

export function GuildRosterTable({ members }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<number | "ALL">("ALL");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "10+" | "20+" | "60">("ALL");
  const [sortBy, setSortBy] = useState<"level" | "name" | "rank">("level");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const availableClasses = useMemo(() => {
    const counts = new Map<number, number>();
    for (const m of members) {
      counts.set(m.classId, (counts.get(m.classId) || 0) + 1);
    }
    return Object.values(WOW_CLASSES)
      .filter((c) => (counts.get(c.id) || 0) > 0)
      .map((c) => ({ ...c, count: counts.get(c.id) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (selectedClass !== "ALL" && m.classId !== selectedClass) return false;
        if (levelFilter === "10+" && m.level < 10) return false;
        if (levelFilter === "20+" && m.level < 20) return false;
        if (levelFilter === "60" && m.level < 60) return false;
        if (q) {
          const matchName = m.fullName.toLowerCase().includes(q);
          const matchSlug = m.slug.toLowerCase().includes(q);
          const matchClass = m.classInfo.name.toLowerCase().includes(q);
          const matchRace = m.raceName.toLowerCase().includes(q);
          return matchName || matchSlug || matchClass || matchRace;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "level") {
          cmp = a.level - b.level;
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName);
        } else if (sortBy === "name") {
          cmp = a.fullName.localeCompare(b.fullName);
        } else if (sortBy === "rank") {
          cmp = a.rank - b.rank;
          if (cmp === 0) cmp = b.level - a.level;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [members, search, selectedClass, levelFilter, sortBy, sortDir]);

  function toggleSort(field: "level" | "name" | "rank") {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "level" ? "desc" : "asc");
    }
  }

  const sortIcon = (field: "level" | "name" | "rank") => (
    <ArrowUpDown
      className={`h-3.5 w-3.5 ${sortBy === field ? "text-marfim" : "text-pedra-escura"}`}
    />
  );

  return (
    <div className="space-y-4">
      {/* Busca e filtros */}
      <div className="rounded-lg border border-borda bg-aco p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative flex-1">
            <span className="sr-only">Buscar personagem</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pedra" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, classe ou raça"
              className="h-12 w-full rounded border border-borda bg-onix pl-10 pr-4 text-sm text-marfim placeholder:text-pedra-escura focus:border-marfim focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por nível">
            <span className="mr-1 text-xs text-pedra">Nível</span>
            {(
              [
                { key: "ALL", label: "Todos" },
                { key: "10+", label: "10+" },
                { key: "20+", label: "20+" },
                { key: "60", label: "60" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                aria-pressed={levelFilter === opt.key}
                onClick={() => setLevelFilter(opt.key)}
                className={chip(levelFilter === opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-borda pt-4" role="group" aria-label="Filtrar por classe">
          <button
            type="button"
            aria-pressed={selectedClass === "ALL"}
            onClick={() => setSelectedClass("ALL")}
            className={chip(selectedClass === "ALL")}
          >
            Todas as classes · {members.length}
          </button>

          {availableClasses.map((cls) => {
            const active = selectedClass === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedClass(active ? "ALL" : cls.id)}
                className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium transition ${
                  active ? "bg-aco-alto" : "border-borda bg-onix hover:border-pedra"
                }`}
                style={active ? { borderColor: cls.color } : undefined}
              >
                <img src={cls.icon} alt="" className="h-4 w-4 rounded-full object-cover" />
                <span style={{ color: cls.color }}>{cls.name}</span>
                <span className="text-pedra-escura">{cls.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="px-1 text-xs text-pedra">
        Exibindo <strong className="text-marfim">{filteredMembers.length}</strong> de{" "}
        <strong className="text-marfim">{members.length}</strong> membros
      </p>

      {/* Tabela */}
      <div className="rounded-lg border border-borda bg-aco overflow-hidden">
        <div className="table-wrapper">
          <table className="roster-table text-left text-sm">
            <thead className="bg-aco-alto text-[11px] font-medium uppercase tracking-[0.14em] text-pedra">
              <tr>
                <th className="py-3 px-4 border-b border-borda">
                  <button type="button" onClick={() => toggleSort("name")} className="flex items-center gap-1.5 uppercase hover:text-marfim">
                    Personagem {sortIcon("name")}
                  </button>
                </th>
                <th className="py-3 px-4 border-b border-borda">Classe</th>
                <th className="py-3 px-4 border-b border-borda">Raça</th>
                <th className="py-3 px-4 border-b border-borda">
                  <button type="button" onClick={() => toggleSort("level")} className="flex items-center gap-1.5 uppercase hover:text-marfim">
                    Nível {sortIcon("level")}
                  </button>
                </th>
                <th className="py-3 px-4 border-b border-borda">
                  <button type="button" onClick={() => toggleSort("rank")} className="flex items-center gap-1.5 uppercase hover:text-marfim">
                    Rank {sortIcon("rank")}
                  </button>
                </th>
                <th className="py-3 px-4 border-b border-borda text-right">
                  <span className="sr-only">Armory</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-pedra">
                    Nenhum personagem encontrado com esses filtros.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const href = `/character/${member.slug}`;
                  return (
                    <tr
                      key={member.id}
                      onClick={() => router.push(href)}
                      className="group cursor-pointer transition hover:bg-aco-alto [&>*]:border-b [&>*]:border-borda/60"
                    >
                      <th scope="row" className="py-3 px-4 font-normal">
                        <Link href={href} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <img
                            src={member.classInfo.icon}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full border-2 object-cover"
                            style={{ borderColor: member.classInfo.color }}
                          />
                          <span
                            className="text-sm font-semibold group-hover:underline underline-offset-4"
                            style={{ color: member.classInfo.color }}
                          >
                            {member.fullName}
                          </span>
                        </Link>
                      </th>

                      <td className="py-3 px-4 text-xs font-medium" style={{ color: member.classInfo.color }}>
                        {member.classInfo.name}
                      </td>

                      <td className="py-3 px-4 text-pedra">{member.raceName}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex min-w-[3.25rem] justify-center rounded border px-2 py-0.5 text-xs font-semibold ${
                            member.level >= 60
                              ? "border-sangue bg-sangue text-marfim"
                              : member.level >= 10
                              ? "border-borda bg-onix text-marfim"
                              : "border-borda bg-onix text-pedra-escura"
                          }`}
                        >
                          {member.level}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-pedra">{member.rankLabel}</td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium transition ${
                            member.armoryAvailable
                              ? "text-marfim group-hover:text-white"
                              : "text-pedra-escura"
                          }`}
                          title={member.armoryAvailable ? undefined : "Equipamentos liberados a partir do nível 10"}
                        >
                          {member.armoryAvailable ? "Ver equipamentos" : "Perfil básico"}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="px-1 text-[11px] text-pedra-escura">
        Equipamentos e talentos ficam disponíveis a partir do nível 10, quando a Blizzard sincroniza o perfil.
      </p>
    </div>
  );
}
