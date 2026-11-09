/**
 * Converte os talentos que a API da Blizzard devolve para um personagem
 * (lista de { nome, rank } por especialização) no formato da calculadora,
 * para desenhar a árvore no perfil.
 *
 * A API não traz linha/coluna, então o casamento é pelo nome do talento,
 * comparando com o nome em pt-BR e em inglês dos dados do Talents Forever.
 * Somente servidor.
 */
import type { CharacterFullProfile } from "./blizzard";
import { TALENT_CLASSES, emptyBuild, encodeBuild, treeNamePt, type TalentClass } from "./talents";
import type { ClassTalentData } from "./talent-rules";

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export interface CharacterTalentTree {
  classSlug: string; // rota da calculadora (paladino)
  className: string;
  dataSlug: string;
  data: ClassTalentData;
  code: string; // ?b= da calculadora
  matched: number; // pontos colocados na árvore
  total: number; // pontos que a API informou
  unmatched: string[]; // nomes que não foram encontrados nos dados
}

export function characterTalentTree(character: CharacterFullProfile): CharacterTalentTree | null {
  const tc: TalentClass | undefined = TALENT_CLASSES.find((c) => c.classId === character.classId);
  if (!tc || character.specializations.length === 0) return null;

  // índice: nome normalizado → posições possíveis (pode repetir entre árvores)
  const index = new Map<string, Array<{ tree: number; i: number; max: number }>>();
  tc.data.trees.forEach((tree, t) =>
    tree.talents.forEach((tal, i) => {
      for (const key of new Set([norm(tal.name), norm(tal.namePt)])) {
        if (!key) continue;
        const list = index.get(key) ?? [];
        list.push({ tree: t, i, max: tal.max });
        index.set(key, list);
      }
    })
  );
  const treeNames = tc.data.trees.map((t) => [norm(t.name), norm(t.namePt), norm(treeNamePt(t.name))]);

  const build = emptyBuild(tc.data);
  const unmatched: string[] = [];
  let total = 0;
  let matched = 0;

  for (const spec of character.specializations) {
    const specKey = norm(spec.name);
    for (const t of spec.talents) {
      total += t.rank;
      const options = index.get(norm(t.name));
      if (!options?.length) {
        unmatched.push(t.name);
        continue;
      }
      // nome repetido em mais de uma árvore: prefere a árvore da especialização
      const pick = options.find((o) => treeNames[o.tree].includes(specKey)) ?? options[0];
      const rank = Math.min(t.rank, pick.max);
      build[pick.tree][pick.i] = Math.max(build[pick.tree][pick.i], rank);
      matched += rank;
    }
  }

  if (matched === 0) return null;
  return {
    classSlug: tc.slug,
    className: tc.name,
    dataSlug: tc.dataSlug,
    data: tc.data,
    code: encodeBuild(build),
    matched,
    total,
    unmatched,
  };
}
