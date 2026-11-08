import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getGuildData } from "@/lib/blizzard";
import { GuildRosterTable } from "@/components/GuildRosterTable";
import { SectionTitle } from "@/components/SectionTitle";

export const revalidate = 300; // Atualiza automaticamente a cada 5 minutos

const MAX_LEVEL = 60;

export default async function HomePage() {
  const guild = await getGuildData("sepultura");
  const topMembers = guild.members.slice(0, 10);
  const createdDate = new Date(guild.createdTimestamp).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" }
  );
  const raceProgress = Math.min(
    100,
    Math.round((guild.stats.highestLevel / MAX_LEVEL) * 100)
  );

  const stats = [
    { label: "Membros", value: guild.stats.totalMembers, hint: "na guilda" },
    { label: "Armory ativo", value: guild.stats.armoryReadyCount, hint: "personagens nível 10+" },
    { label: "Nível 20+", value: guild.stats.level20PlusCount, hint: `média geral: nível ${guild.stats.averageLevel}` },
    { label: "Nível 60", value: guild.stats.level60Count, hint: "no topo da Horda" },
  ];

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="space-y-6 max-w-2xl order-2 lg:order-1">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-pedra">
            <span className="text-sangue-claro">{guild.faction.name}</span>
            <span className="mx-2 text-borda">/</span>
            Ruleset {guild.ruleset.name} (US)
            <span className="mx-2 text-borda">/</span>
            desde {createdDate}
          </p>

          <div className="space-y-3">
            <h1 className="font-display text-5xl sm:text-7xl font-bold leading-none text-marfim">
              {guild.name}
            </h1>
            <div className="h-[3px] w-28 bg-sangue-vivo" />
          </div>

          <p className="text-base text-pedra leading-relaxed">
            Armory privado da guilda. Acompanhe a evolução dos membros e
            inspecione equipamentos, atributos e talentos, sincronizados com a
            API oficial da Blizzard.
          </p>

          {/* Corrida para o 60 */}
          <div className="rounded-lg border border-borda bg-aco p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-pedra">
                Corrida para o 60
              </span>
              <span className="text-sm text-pedra">
                <strong className="font-display text-2xl text-marfim">
                  Nv. {guild.stats.highestLevel}
                </strong>{" "}
                / {MAX_LEVEL}
              </span>
            </div>
            <div
              className="h-1 w-full rounded-full bg-borda"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={MAX_LEVEL}
              aria-valuenow={guild.stats.highestLevel}
              aria-label="Maior nível da guilda"
            >
              <div
                className="h-full rounded-full bg-sangue-vivo"
                style={{ width: `${raceProgress}%` }}
              />
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 border-y border-borda divide-x divide-borda">
            {stats.map((s) => (
              <div key={s.label} className="py-4 px-4 first:pl-0">
                <dt className="text-xs text-pedra">{s.label}</dt>
                <dd className="mt-1 text-3xl font-semibold text-marfim">{s.value}</dd>
                <dd className="mt-0.5 text-[11px] text-pedra-escura">{s.hint}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 lg:order-2 mx-auto w-64 sm:w-80 lg:w-[440px]">
          {/* Emblema em brasa: brilho pulsando + tremulação (só CSS, sem fagulhas) */}
          <div className="ember-emblem relative">
            <img
              src="/brand/sepultura-emblema.webp"
              alt="Emblema da guilda Sepultura: presas e machado em forma de S, com o lema Sangue e Honra"
              width={1024}
              height={1024}
              className="ember-emblem__img emblem-fade relative h-auto w-full"
            />
            <div className="ember-emblem__glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* TOP 10 + COMPOSIÇÃO */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <section className="lg:col-span-8 space-y-5">
          <SectionTitle
            id="top-10"
            index="01"
            title="Top 10"
            description="Os 10 maiores níveis da guilda"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topMembers.map((member, index) => (
              <Link
                key={member.id}
                href={`/character/${member.slug}`}
                className="group flex flex-col gap-4 rounded-lg border border-borda bg-aco p-4 transition hover:border-pedra hover:bg-aco-alto"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-sm font-bold text-pedra-escura w-5">
                    {index + 1}
                  </span>
                  <img
                    src={member.classInfo.icon}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full border-2 object-cover"
                    style={{ borderColor: member.classInfo.color }}
                  />
                  <div className="min-w-0">
                    <h3
                      className="truncate text-sm font-semibold"
                      style={{ color: member.classInfo.color }}
                    >
                      {member.fullName}
                    </h3>
                    <p className="truncate text-xs text-pedra">
                      {member.raceName} · {member.classInfo.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-borda pt-3 text-xs">
                  <span className="font-semibold text-marfim">
                    Nível {member.level}
                  </span>
                  <span className="inline-flex items-center gap-1 text-pedra transition group-hover:text-marfim">
                    Inspecionar
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-5">
          <SectionTitle index="02" title="Composição" />

          <div className="space-y-3.5 rounded-lg border border-borda bg-aco p-5">
            {guild.stats.classBreakdown.map((item) => (
              <div key={item.classInfo.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold">
                    <img
                      src={item.classInfo.icon}
                      alt=""
                      className="h-4 w-4 rounded-full"
                    />
                    <span style={{ color: item.classInfo.color }}>
                      {item.classInfo.name}
                    </span>
                  </span>
                  <span className="text-pedra">
                    <strong className="text-marfim">{item.count}</strong> ·{" "}
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-borda">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(item.percentage, 3)}%`,
                      backgroundColor: item.classInfo.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* MEMBROS */}
      <section className="space-y-5">
        <SectionTitle
          id="membros"
          index="03"
          title="Membros"
          description="Clique em um personagem para abrir o armory"
        />
        <GuildRosterTable members={guild.members} />
      </section>
    </div>
  );
}
