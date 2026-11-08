"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Swords,
  Sparkles,
  Heart,
  Zap,
  Award,
  ExternalLink,
  AlertCircle,
  Layers,
} from "lucide-react";
import type {
  CharacterFullProfile,
  EquippedItemEnriched,
} from "@/lib/blizzard";
import {
  LEFT_PAPERDOLL_SLOTS,
  RIGHT_PAPERDOLL_SLOTS,
  BOTTOM_PAPERDOLL_SLOTS,
  PaperdollSlotDef,
  getQualityStyle,
} from "@/lib/wow-constants";

interface Props {
  character: CharacterFullProfile;
}

export function CharacterArmoryClient({ character }: Props) {
  const firstEquipped = character.equippedItemsList[0] || null;
  const [selectedItem, setSelectedItem] = useState<EquippedItemEnriched | null>(
    firstEquipped
  );
  const [activeTab, setActiveTab] = useState<"stats" | "talents" | "gearList">(
    "stats"
  );

  const stats = character.statistics;

  return (
    <div className="space-y-8">
      {/* Navegação superior */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/#membros"
          className="inline-flex items-center gap-2 rounded-lg border border-borda bg-aco px-4 py-2 text-sm font-medium text-marfim transition hover:border-pedra hover:text-marfim"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para os membros</span>
        </Link>

        <a
          href={`https://worldofwarcraft.blizzard.com/pt-br/forever/us/armory/character/${character.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-borda bg-onix px-4 py-2 text-xs font-semibold text-marfim transition hover:bg-aco-alto"
        >
          <span>Ver no Armory Oficial da Blizzard</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Header do Personagem */}
      <div
        className="relative overflow-hidden rounded-lg border border-borda border-t-2 bg-aco p-6 sm:p-8"
        style={{ borderTopColor: character.classInfo.color }}
      >

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar do Personagem */}
            <div
              className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-black"
              style={{ borderColor: character.classInfo.color }}
            >
              <img
                src={character.avatarUrl || character.classInfo.icon}
                alt={character.fullName}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 right-1 rounded bg-onix/90 px-1.5 py-0.5 text-xs font-semibold text-marfim border border-borda">
                Nv. {character.level}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className="font-display text-3xl sm:text-4xl xl:text-5xl font-bold leading-tight"
                  style={{ color: character.classInfo.color }}
                >
                  {character.fullName}
                </h1>
                <span className="rounded border border-borda bg-onix px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-pedra">
                  {character.guildName}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-pedra">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <img
                    src={character.classInfo.icon}
                    alt={character.classInfo.name}
                    className="h-4 w-4 rounded-sm"
                  />
                  <span style={{ color: character.classInfo.color }}>
                    {character.classInfo.name}
                  </span>
                </span>
                <span>•</span>
                <span>{character.raceName}</span>
                <span>•</span>
                <span className="text-sangue-claro font-medium">
                  {character.factionName}
                </span>
                {character.guildRankLabel && (
                  <>
                    <span>•</span>
                    <span className="text-marfim">
                      {character.guildRankLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Badges Rápidos (iLvl, HKs, Peças Equipadas) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-lg border border-borda bg-onix px-4 py-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-pedra">
                Item Level
              </div>
              <div className="mt-0.5 text-2xl font-semibold text-marfim">
                {character.equippedItemLevel || "—"}
              </div>
            </div>

            <div className="rounded-lg border border-borda bg-onix px-4 py-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-pedra">
                Itens
              </div>
              <div className="mt-0.5 text-2xl font-semibold text-marfim">
                {character.equippedItemsList.length}
              </div>
            </div>

            <div className="rounded-lg border border-borda bg-onix px-4 py-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-pedra">
                Abates (HKs)
              </div>
              <div className="mt-0.5 text-2xl font-semibold text-marfim">
                {character.honorableKills}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso caso personagem seja < Nível 10 */}
      {character.isPartialFromRoster ? (
        <div className="rounded-lg border border-borda bg-onix p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-marfim" />
          <h2 className="font-display text-xl font-bold text-marfim">
            Personagem abaixo do Nível 10 no Armory da Blizzard
          </h2>
          <p className="mx-auto max-w-xl text-sm text-marfim">
            <strong>{character.fullName}</strong> já faz parte da lista oficial de membros
            da guilda <strong>Sepultura</strong> (Nível {character.level} •{" "}
            {character.raceName} {character.classInfo.name}), mas a API oficial
            do <em>World of Warcraft: Forever</em> só libera a inspeção de
            equipamentos, atributos e talentos a partir do{" "}
            <strong>Nível 10</strong> após deslogar do jogo.
          </p>
        </div>
      ) : (
        <>
          {/* PAPERDOLL ARMORY + IN-GAME ITEM TOOLTIP */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Paperdoll (8 colunas no desktop) */}
            <div className="xl:col-span-8 rounded-lg border border-borda bg-aco p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-borda pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-marfim" />
                  <h2 className="font-display text-lg font-bold text-marfim">
                    Equipamento
                  </h2>
                </div>
                <span className="text-xs text-pedra">
                  Passe o mouse ou clique em um slot para inspecionar o item
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-center">
                {/* Coluna Esquerda (8 slots) */}
                <div className="md:col-span-4 space-y-2.5">
                  {LEFT_PAPERDOLL_SLOTS.map((slot) => (
                    <PaperdollSlotItem
                      key={slot.type}
                      slot={slot}
                      item={character.equippedItems[slot.type]}
                      isSelected={
                        Boolean(selectedItem) &&
                        selectedItem?.slotType === slot.type
                      }
                      align="left"
                      onSelect={(item) => setSelectedItem(item)}
                    />
                  ))}
                </div>

                {/* Centro: Render 3D do Personagem */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-lg border border-borda bg-onix bg-[radial-gradient(ellipse_at_50%_35%,rgb(var(--color-sangue-orc)/0.25),transparent_65%)]">
                    {character.mainRenderUrl ? (
                      <img
                        src={character.mainRenderUrl}
                        alt={character.fullName}
                        className="h-full w-full object-cover object-[50%_30%] drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)]"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <img
                          src={character.classInfo.icon}
                          alt={character.classInfo.name}
                          className="mx-auto h-20 w-20 rounded-lg border border-borda"
                        />
                        <p className="text-xs text-pedra">
                          Render 3D sincronizando com a Blizzard
                        </p>
                      </div>
                    )}

                    {/* Barra rápida de Vida e Recurso sobre o rodapé do modelo */}
                    {stats && (
                      <div className="absolute bottom-3 inset-x-3 space-y-1.5 rounded-lg bg-onix/90 p-2.5 border border-borda">
                        <div className="flex items-center justify-between text-xs font-bold bg-vil-profundo border border-vil/40 rounded px-2.5 py-1 text-vil">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-vil" />
                            Vida
                          </span>
                          <span>{stats.health?.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold bg-blue-950/90 border border-blue-500/40 rounded px-2.5 py-1 text-blue-300">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 text-blue-400" />
                            {stats.power_type?.name || "Recurso"}
                          </span>
                          <span>{stats.power?.toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna Direita (8 slots) */}
                <div className="md:col-span-4 space-y-2.5">
                  {RIGHT_PAPERDOLL_SLOTS.map((slot) => (
                    <PaperdollSlotItem
                      key={slot.type}
                      slot={slot}
                      item={character.equippedItems[slot.type]}
                      isSelected={
                        Boolean(selectedItem) &&
                        selectedItem?.slotType === slot.type
                      }
                      align="right"
                      onSelect={(item) => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>

              {/* Linha Inferior: Armas (Main Hand, Off Hand, Ranged) */}
              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-borda pt-4 sm:grid-cols-3">
                {BOTTOM_PAPERDOLL_SLOTS.map((slot) => (
                  <PaperdollSlotItem
                    key={slot.type}
                    slot={slot}
                    item={character.equippedItems[slot.type]}
                    isSelected={
                      Boolean(selectedItem) &&
                      selectedItem?.slotType === slot.type
                    }
                    align="left"
                    onSelect={(item) => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>

            {/* Painel de Tooltip Oficial do Item (4 colunas no desktop) */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              <div className="rounded-lg border border-borda bg-onix p-5 flex-1">
                <div className="mb-3 flex items-center justify-between border-b border-borda pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-marfim">
                    Tooltip do Item Selecionado
                  </span>
                  {selectedItem && (
                    <span className="text-[11px] text-pedra">
                      ID #{selectedItem.id}
                    </span>
                  )}
                </div>

                {selectedItem ? (
                  <WowItemTooltip item={selectedItem} />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-center text-pedra">
                    <Sparkles className="mb-2 h-8 w-8 text-pedra-escura" />
                    <p className="text-sm">
                      Passe o mouse ou clique em um equipamento ao lado para ver
                      todos os atributos detalhados.
                    </p>
                  </div>
                )}
              </div>

              {/* Resumo rápido de Talentos Ativos */}
              <div className="rounded-lg border border-borda bg-aco p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-marfim">
                    Resumo de Talentos
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("talents")}
                    className="text-xs font-semibold text-marfim hover:underline"
                  >
                    Ver árvore completa →
                  </button>
                </div>

                {character.specializations.length === 0 ? (
                  <p className="text-xs text-pedra">
                    Nenhum ponto de talento distribuído até o momento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {character.specializations.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center justify-between rounded-lg border border-borda bg-onix px-3.5 py-2.5"
                      >
                        <span className="text-sm font-bold text-marfim">
                          {spec.name}
                        </span>
                        <span className="rounded bg-onix border border-borda px-2.5 py-0.5 text-xs font-semibold text-marfim">
                          {spec.pointsSpent} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ABAS DE DETALHES: ATRIBUTOS | TALENTOS | LISTA DE ITENS */}
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 border-b border-borda pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  activeTab === "stats"
                    ? "border border-sangue bg-sangue text-marfim"
                    : "border border-borda bg-aco text-pedra hover:border-pedra hover:text-marfim"
                }`}
              >
                <Swords className="h-4 w-4" />
                <span>Atributos & Estatísticas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("talents")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  activeTab === "talents"
                    ? "border border-sangue bg-sangue text-marfim"
                    : "border border-borda bg-aco text-pedra hover:border-pedra hover:text-marfim"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>
                  Talentos ({character.specializations.reduce((a, s) => a + s.pointsSpent, 0)} pts)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("gearList")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  activeTab === "gearList"
                    ? "border border-sangue bg-sangue text-marfim"
                    : "border border-borda bg-aco text-pedra hover:border-pedra hover:text-marfim"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>
                  Tabela de Equipamentos ({character.equippedItemsList.length})
                </span>
              </button>
            </div>

            {/* ABA 1: ATRIBUTOS */}
            {activeTab === "stats" && stats && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {/* Atributos Base */}
                <div className="rounded-lg border border-borda bg-aco p-5 space-y-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-pedra border-b border-borda pb-2">
                    Atributos Primários
                  </h3>
                  <StatRow
                    label="Força (Strength)"
                    value={stats.strength?.effective ?? 0}
                    sub={`Base: ${stats.strength?.base ?? 0}`}
                  />
                  <StatRow
                    label="Agilidade (Agility)"
                    value={stats.agility?.effective ?? 0}
                    sub={`Base: ${stats.agility?.base ?? 0}`}
                  />
                  <StatRow
                    label="Vigor (Stamina)"
                    value={stats.stamina?.effective ?? 0}
                    sub={`Base: ${stats.stamina?.base ?? 0}`}
                  />
                  <StatRow
                    label="Intelecto (Intellect)"
                    value={stats.intellect?.effective ?? 0}
                    sub={`Base: ${stats.intellect?.base ?? 0}`}
                  />
                  <StatRow
                    label="Espírito (Spirit)"
                    value={stats.spirit?.effective ?? 0}
                    sub={`Base: ${stats.spirit?.base ?? 0}`}
                  />
                </div>

                {/* Combate Corpo a Corpo */}
                <div className="rounded-lg border border-borda bg-aco p-5 space-y-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-pedra border-b border-borda pb-2">
                    Corpo a Corpo (Melee)
                  </h3>
                  <StatRow
                    label="Poder de Ataque"
                    value={stats.attack_power ?? 0}
                  />
                  <StatRow
                    label="Crítico Melee"
                    value={`${(stats.melee_crit?.value ?? 0).toFixed(2)}%`}
                  />
                  <StatRow
                    label="DPS Mão Principal"
                    value={(stats.main_hand_dps ?? 0).toFixed(1)}
                    sub={`Vel: ${stats.main_hand_speed ?? 0}s`}
                  />
                  <StatRow
                    label="Dano Mão Principal"
                    value={`${Math.round(stats.main_hand_damage_min ?? 0)} - ${Math.round(
                      stats.main_hand_damage_max ?? 0
                    )}`}
                  />
                  <StatRow
                    label="Aceleração (Haste)"
                    value={`${(stats.melee_haste?.value ?? 0).toFixed(2)}%`}
                  />
                </div>

                {/* Feitiços & Magia */}
                <div className="rounded-lg border border-borda bg-aco p-5 space-y-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-pedra border-b border-borda pb-2">
                    Feitiços (Spell)
                  </h3>
                  <StatRow
                    label="Poder Mágico (Spell Power)"
                    value={stats.spell_power ?? 0}
                  />
                  <StatRow
                    label="Crítico Mágico"
                    value={`${(stats.spell_crit?.value ?? 0).toFixed(2)}%`}
                  />
                  <StatRow
                    label="Penetração Mágica"
                    value={stats.spell_penetration ?? 0}
                  />
                  <StatRow
                    label="Regen. de Mana"
                    value={stats.mana_regen ?? 0}
                    sub={`Em combate: ${stats.mana_regen_combat ?? 0}`}
                  />
                  <StatRow
                    label="Aceleração Mágica"
                    value={`${(stats.spell_haste?.value ?? 0).toFixed(2)}%`}
                  />
                </div>

                {/* Defesa & Sobrevivência */}
                <div className="rounded-lg border border-borda bg-aco p-5 space-y-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-pedra border-b border-borda pb-2">
                    Defesa & Mitigação
                  </h3>
                  <StatRow
                    label="Armadura (Armor)"
                    value={stats.armor?.effective ?? 0}
                    sub={`Base: ${stats.armor?.base ?? 0}`}
                  />
                  <StatRow
                    label="Esquiva (Dodge)"
                    value={`${(stats.dodge?.value ?? 0).toFixed(2)}%`}
                  />
                  <StatRow
                    label="Aparo (Parry)"
                    value={`${(stats.parry?.value ?? 0).toFixed(2)}%`}
                  />
                  <StatRow
                    label="Bloqueio (Block)"
                    value={`${(stats.block?.value ?? 0).toFixed(2)}%`}
                  />
                  <StatRow
                    label="Defesa"
                    value={stats.defense?.effective ?? 0}
                  />
                </div>
              </div>
            )}

            {/* ABA 2: TALENTOS */}
            {activeTab === "talents" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {character.specializations.length === 0 ? (
                  <div className="col-span-3 rounded-lg border border-borda bg-aco p-8 text-center text-pedra">
                    Este personagem ainda não possui talentos ativos registrados
                    na API.
                  </div>
                ) : (
                  character.specializations.map((spec) => (
                    <div
                      key={spec.id}
                      className="rounded-lg border border-borda bg-aco p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-borda pb-3">
                        <h3 className="font-display text-lg font-bold text-marfim">
                          {spec.name}
                        </h3>
                        <span className="rounded bg-onix border border-borda px-3 py-1 text-xs font-semibold text-marfim">
                          {spec.pointsSpent} Pontos
                        </span>
                      </div>

                      <div className="space-y-3">
                        {spec.talents.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-lg border border-borda bg-onix p-3.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-marfim text-sm">
                                {t.name}
                              </span>
                              <span className="rounded bg-vil-profundo border border-vil/40 px-2 py-0.5 text-xs font-semibold text-vil">
                                Rank {t.rank}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-marfim">
                              {t.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ABA 3: TABELA DE EQUIPAMENTOS */}
            {activeTab === "gearList" && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {character.equippedItemsList.map((item) => {
                  const qStyle = getQualityStyle(item.qualityType);
                  return (
                    <div
                      key={`${item.slotType}-${item.id}`}
                      onClick={() => setSelectedItem(item)}
                      className="cursor-pointer rounded-lg border border-borda bg-aco p-4 transition hover:border-pedra hover:bg-aco-alto"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={item.iconUrl}
                          alt={item.name}
                          className={`h-12 w-12 rounded border-2 object-cover ${qStyle.borderClass}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-pedra">
                              {item.slotName} • {item.itemSubclass || item.itemClass}
                            </span>
                            <span className="rounded bg-onix px-2 py-0.5 text-xs font-bold text-marfim">
                              iLvl {item.itemLevel}
                            </span>
                          </div>
                          <h4
                            className={`truncate text-sm font-semibold mt-0.5 ${qStyle.textClass}`}
                          >
                            {item.name}
                          </h4>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item.armorDisplay && (
                              <span className="rounded bg-onix px-2 py-0.5 text-[11px] text-marfim">
                                {item.armorDisplay}
                              </span>
                            )}
                            {item.stats.map((st, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-vil-profundo border border-vil/40 px-2 py-0.5 text-[11px] text-vil"
                              >
                                {st.displayString}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PaperdollSlotItem({
  slot,
  item,
  isSelected,
  align,
  onSelect,
}: {
  slot: PaperdollSlotDef;
  item?: EquippedItemEnriched;
  isSelected: boolean;
  align: "left" | "right";
  onSelect: (item: EquippedItemEnriched) => void;
}) {
  const qStyle = getQualityStyle(item?.qualityType);

  return (
    <div
      onMouseEnter={() => item && onSelect(item)}
      onClick={() => item && onSelect(item)}
      className={`group flex items-center gap-3 rounded-lg border p-2 transition ${
        item ? "cursor-pointer" : "opacity-55"
      } ${
        isSelected
          ? "border-marfim bg-aco-alto"
          : "border-borda bg-onix hover:border-pedra hover:bg-aco-alto"
      } ${align === "right" ? "md:flex-row-reverse md:text-right" : ""}`}
    >
      <div
        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded border-2 bg-black ${
          item ? qStyle.borderClass : "border-borda"
        }`}
      >
        <img
          src={item ? item.iconUrl : slot.emptyIcon}
          alt={item ? item.name : slot.label}
          className="h-full w-full object-cover"
        />
        {item && (
          <span className="absolute bottom-0 right-0 rounded-tl bg-onix/90 px-1 text-[10px] font-semibold text-marfim">
            {item.itemLevel}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-pedra-escura">
          {slot.label}
        </div>
        {item ? (
          <div className={`truncate text-xs font-bold ${qStyle.textClass}`}>
            {item.name}
          </div>
        ) : (
          <div className="text-xs text-pedra-escura italic">Vazio</div>
        )}
      </div>
    </div>
  );
}

function WowItemTooltip({ item }: { item: EquippedItemEnriched }) {
  const qStyle = getQualityStyle(item.qualityType);

  return (
    <div className="rounded-lg border-2 border-borda bg-onix p-4 text-sm space-y-2 font-sans">
      {/* Cabeçalho com ícone e nome */}
      <div className="flex items-start gap-3">
        <img
          src={item.iconUrl}
          alt={item.name}
          className={`h-12 w-12 rounded border-2 ${qStyle.borderClass}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className={`text-base font-semibold leading-snug ${qStyle.textClass}`}>
            {item.name}
          </h3>
          <p className="text-xs font-bold text-[#ffd100]">
            {item.itemLevelDisplay}
          </p>
        </div>
      </div>

      {/* Vinculação */}
      {item.binding && (
        <div className="text-xs text-marfim">{item.binding}</div>
      )}

      {/* Slot e Tipo de Armadura/Arma */}
      <div className="flex items-center justify-between text-xs text-marfim">
        <span>{item.inventoryName}</span>
        <span className="text-marfim">{item.itemSubclass}</span>
      </div>

      {/* Armadura */}
      {item.armorDisplay && (
        <div className="text-xs text-marfim">{item.armorDisplay}</div>
      )}

      {/* Info de Arma */}
      {item.weaponInfo && (
        <div className="space-y-0.5 text-xs text-marfim">
          <div className="flex items-center justify-between">
            <span>{item.weaponInfo.damageDisplay}</span>
            <span>{item.weaponInfo.speedDisplay}</span>
          </div>
          {item.weaponInfo.dpsDisplay && (
            <div className="text-marfim">{item.weaponInfo.dpsDisplay}</div>
          )}
        </div>
      )}

      {/* Atributos Primários */}
      {item.stats.length > 0 && (
        <div className="space-y-0.5 pt-1">
          {item.stats.map((st, idx) => (
            <div
              key={idx}
              className={
                st.isEquipBonus
                  ? "text-xs text-[#1eff00]"
                  : "text-xs text-marfim"
              }
            >
              {st.displayString}
            </div>
          ))}
        </div>
      )}

      {/* Encantamentos */}
      {item.enchantments.length > 0 && (
        <div className="space-y-0.5 pt-1">
          {item.enchantments.map((enc, idx) => (
            <div key={idx} className="text-xs text-[#1eff00]">
              {enc.displayString}
            </div>
          ))}
        </div>
      )}

      {/* Efeitos de Equipar / Uso */}
      {item.spells.length > 0 && (
        <div className="space-y-1 pt-1">
          {item.spells.map((sp, idx) => (
            <div key={idx} className="text-xs text-[#1eff00] leading-relaxed">
              {sp.description}
            </div>
          ))}
        </div>
      )}

      {/* Durabilidade e Nível Requerido */}
      <div className="space-y-0.5 pt-2 border-t border-borda text-xs text-marfim">
        {item.durabilityDisplay && <div>{item.durabilityDisplay}</div>}
        {item.requiredLevelDisplay && <div>{item.requiredLevelDisplay}</div>}
      </div>

      {/* Preço de Venda */}
      {item.sellPrice && (
        <div className="flex items-center gap-2 pt-1 text-xs text-marfim">
          <span>{item.sellPrice.header}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-marfim">
            {item.sellPrice.gold}g
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-marfim">
            {item.sellPrice.silver}s
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-sangue-vivo">
            {item.sellPrice.copper}c
          </span>
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-pedra">{label}</span>
      <div className="text-right">
        <span className="font-bold text-marfim">{value}</span>
        {sub && <span className="ml-1.5 text-[10px] text-pedra-escura">({sub})</span>}
      </div>
    </div>
  );
}
