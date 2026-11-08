import type { ClassTalentData } from "@/lib/talent-rules";

/** Crédito obrigatório da licença CC BY 4.0 (Talents Forever). */
export function TalentCredit({ data }: { data?: ClassTalentData }) {
  const date = data?.generated ? data.generated.split("-").reverse().join("/") : null;
  return (
    <p className="border-t border-borda pt-4 text-xs leading-relaxed text-pedra">
      Dados de talentos:{" "}
      <a
        href="https://talentsforever.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-marfim underline underline-offset-4 hover:text-white"
      >
        Talents Forever
      </a>
      , licenciados sob{" "}
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noopener noreferrer license"
        className="text-marfim underline underline-offset-4 hover:text-white"
      >
        CC BY 4.0
      </a>
      . Tradução: textos oficiais do cliente em português do WoW: Forever. Nomes e textos dos talentos pertencem à Blizzard Entertainment.
      {data?.build && <> Build {data.build}</>}
      {date && <> · atualizado em {date}</>}.
    </p>
  );
}
