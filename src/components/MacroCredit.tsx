import type { ClassMacroData } from "@/lib/macro-labels";

const link = "text-marfim underline underline-offset-4 hover:text-white";
const br = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

/** Crédito obrigatório da licença CC BY 4.0 (Classic WoW Forever). */
export function MacroCredit({ data }: { data?: ClassMacroData | null }) {
  const reviewed = br(data?.reviewed);
  const fetched = br(data?.fetched);
  return (
    <p className="border-t border-borda pt-4 text-xs leading-relaxed text-pedra">
      Macros:{" "}
      <a href={data?.attribution.url ?? "https://classicwowforever.com/macros/"} target="_blank" rel="noopener noreferrer" className={link}>
        Classic WoW Forever
      </a>
      , licenciadas sob{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer license" className={link}>
        CC BY 4.0
      </a>
      . Alterações nossas: interface em português e versão do código com os nomes das magias do cliente pt-BR (tradução automática a partir dos arquivos do jogo). Títulos e descrições estão no texto original em inglês. Segundo a fonte, parte das macros ainda não foi testada no cliente do Forever. Nomes de magias e itens pertencem à Blizzard Entertainment.
      {reviewed && <> Revisão da fonte: {reviewed}.</>}
      {fetched && <> Importado em {fetched}.</>}
    </p>
  );
}
