#!/usr/bin/env node
/**
 * Baixa as árvores de talento do WoW: Forever para as 9 classes e salva em
 * src/data/talents/<classe>.json.
 *
 * Fonte: export público do Talents Forever
 *   https://talentsforever.com/export/<classe>.json
 * Licença dos dados: CC BY 4.0 — o site deve creditar talentsforever.com com link.
 * Nomes e textos de tooltip pertencem à Blizzard Entertainment.
 *
 * Uso:
 *   npm run talents:fetch               (todas as classes)
 *   npm run talents:fetch -- warrior    (só uma classe)
 *
 * Rode de novo sempre que o jogo tiver atualização de talentos.
 * Não precisa de chave nem gasta créditos.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLASSES = [
  "warrior",
  "paladin",
  "hunter",
  "rogue",
  "priest",
  "shaman",
  "mage",
  "warlock",
  "druid",
];

const SOURCE = "https://talentsforever.com/export";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "data", "talents");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchClass(cls) {
  const url = `${SOURCE}/${cls}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "sepultura-guild-armory (talent calculator)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const raw = await res.json();
  const trees = raw?.talents?.trees;
  if (!Array.isArray(trees) || trees.length !== 3) {
    throw new Error(`formato inesperado em ${url} (esperava talents.trees com 3 árvores)`);
  }

  // Guarda só o necessário para a calculadora (o export completo inclui o
  // livro de feitiços inteiro, que não usamos aqui).
  return {
    slug: cls,
    class: raw.class,
    icon: raw.talents.icon,
    generated: raw.generated,
    build: raw.spellbook?.build ?? null,
    source: raw.talents.source ?? null,
    classicTotal: raw.talents.classic_total ?? null,
    attribution: {
      text: "Dados de talentos: Talents Forever, licenciados sob CC BY 4.0.",
      url: "https://talentsforever.com/",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      readme: raw._readme ?? null,
    },
    trees: trees.map((t) => ({
      name: t.name,
      icon: t.icon,
      bg: t.bg ?? null,
      removed: t.removed ?? [],
      talents: (t.talents ?? []).map((tal) => ({
        name: tal.name,
        row: tal.row,
        col: tal.col,
        max: tal.max,
        icon: tal.icon,
        passive: Boolean(tal.passive),
        desc: tal.desc ?? [],
        req: tal.req ?? null,
        cost: tal.cost ?? null,
        hotfix: tal.hotfix ?? null,
        classic: tal.classic ?? null,
      })),
    })),
  };
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const targets = only.length ? CLASSES.filter((c) => only.includes(c)) : CLASSES;
  if (!targets.length) throw new Error(`Classe inválida. Use uma de: ${CLASSES.join(", ")}`);

  await mkdir(outDir, { recursive: true });
  const failures = [];

  for (const [i, cls] of targets.entries()) {
    if (i > 0) await sleep(400); // gentil com o servidor deles
    process.stdout.write(`→ ${cls}... `);
    try {
      const data = await fetchClass(cls);
      const count = data.trees.reduce((n, t) => n + t.talents.length, 0);
      await writeFile(path.join(outDir, `${cls}.json`), JSON.stringify(data, null, 2) + "\n", "utf8");
      console.log(`ok (${data.trees.map((t) => t.name).join(" / ")}, ${count} talentos, gerado em ${data.generated})`);
    } catch (err) {
      failures.push(cls);
      console.log(`FALHOU — ${err.message}`);
    }
  }

  if (failures.length) {
    console.log(`\nFalharam: ${failures.join(", ")}. Rode de novo: npm run talents:fetch -- ${failures.join(" ")}`);
    process.exitCode = 1;
  } else {
    console.log(`\nArquivos salvos em src/data/talents/. Crédito obrigatório: talentsforever.com (CC BY 4.0).`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
