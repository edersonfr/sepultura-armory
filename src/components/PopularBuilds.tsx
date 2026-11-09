import type { ClassTalentData } from "@/lib/talent-rules";
import { iconUrl, talentName, treeNamePt } from "@/lib/talent-rules";
import type { PopularStats } from "@/lib/build-stats";
import { SectionTitle } from "./SectionTitle";

interface Props {
  stats: PopularStats;
  data: ClassTalentData;
  classSlug: string; // rota em pt (paladino)
  classColor?: string;
}

const TREE_OPACITY = [1, 0.6, 0.32];
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (r: number) => `${Math.round(r * 100)}%`;
const dateBr = (d: string) => d.split("-").reverse().join("/");

/** Builds mais montadas pela guilda nesta classe (contador próprio, sem identidades). */
export function PopularBuilds({ stats, data, classSlug, classColor = "#e6cc80" }: Props) {
  const treeLabel = (i: number) => data.trees[i].namePt || treeNamePt(data.trees[i].name);
  const topScore = stats.families[0]?.score || 1;

  const ranked = [...stats.picks].sort((a, b) => b.rate - a.rate);
  const everyone = ranked.slice(0, 5);
  const nobody = ranked.slice(-5).reverse();

  return (
    <section className="space-y-6 rounded-lg border border-borda bg-aco p-5" aria-labelledby="populares">
      <div className="space-y-2">
        <SectionTitle id="populares" title="Builds populares da guilda" />
        <p className="text-xs text-pedra">
          O que a Sepultura montou aqui com 41+ pontos desde {dateBr(stats.since)} (último hotfix de talentos). Recontado a
          cada poucas horas. Mede escolha, não força.
        </p>
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {[
          ["builds diferentes", stats.totals.builds],
          ["planejadas", stats.totals.planned],
          ["links abertos", stats.totals.opened],
          ["compartilhadas", stats.totals.shared],
        ].map(([label, n]) => (
          <div key={label as string} className="flex items-baseline gap-1.5">
            <dd className="font-semibold text-marfim">{fmt(n as number)}</dd>
            <dt className="text-pedra">{label}</dt>
          </div>
        ))}
      </dl>

      {/* Divisão por árvore */}
      <div className="space-y-2">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-onix" role="img" aria-label="Divisão por árvore">
          {stats.treeShare.map((share, i) => (
            <div
              key={i}
              style={{ width: pct(share), backgroundColor: classColor, opacity: TREE_OPACITY[i] }}
              className={i > 0 ? "border-l border-onix" : ""}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
          {stats.treeShare.map((share, i) => (
            <li key={i} className="flex items-center gap-1.5 text-pedra">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: classColor, opacity: TREE_OPACITY[i] }} />
              {treeLabel(i)} <span className="font-semibold text-marfim">{pct(share)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Top famílias */}
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stats.families.map((f, i) => (
          <li key={f.code} className="flex items-center gap-4 rounded border border-borda bg-onix p-4">
            <span className="font-display text-lg font-bold text-pedra">#{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm">
                <span className="font-semibold text-marfim">{f.perTree.join(" / ")}</span>{" "}
                <span className="text-pedra">{treeLabel(f.mainTree)}</span>
              </p>
              <div className="h-1 rounded-full bg-aco">
                <div
                  className="h-1 rounded-full"
                  style={{ width: pct(f.score / topScore), backgroundColor: classColor }}
                />
              </div>
              <p className="text-[11px] leading-snug text-pedra">
                {fmt(f.planned)} planejadas · {fmt(f.opened)} abertas · {fmt(f.shared)} compartilhadas
                {f.variants > 1 && <> · {f.variants} variações próximas</>}
              </p>
            </div>
            {/* <a> (e não <Link>) para a calculadora reler o ?b= ao carregar */}
            <a
              href={`/talentos/${classSlug}?b=${f.code}`}
              className="inline-flex h-9 shrink-0 items-center rounded border border-borda px-3 text-sm font-medium text-marfim transition hover:border-pedra"
            >
              Carregar
            </a>
          </li>
        ))}
      </ol>

      {/* Pick rates */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[
          { title: "Quase todo mundo pega", list: everyone, tone: "text-vil" },
          { title: "Quase ninguém pega", list: nobody, tone: "text-sangue-claro" },
        ].map(({ title, list, tone }) => (
          <div key={title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-pedra">{title}</h3>
            <ul className="space-y-1.5">
              {list.map((p) => {
                const t = data.trees[p.tree].talents[p.index];
                return (
                  <li key={`${p.tree}-${p.index}`} className="flex items-center gap-2.5 text-sm">
                    <img src={iconUrl(t.icon)} alt="" className="h-6 w-6 rounded border border-borda" />
                    <span className="truncate text-marfim">{talentName(t)}</span>
                    <span className="text-xs text-pedra-escura">{treeLabel(p.tree)}</span>
                    <span className={`ml-auto font-semibold ${tone}`}>{pct(p.rate)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
