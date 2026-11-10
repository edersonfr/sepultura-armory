#!/usr/bin/env node
/**
 * Baixa as macros do WoW: Forever para as 9 classes e salva em
 * src/data/macros/<classe>.json.
 *
 * Fonte: Classic WoW Forever — https://classicwowforever.com/macros/
 * Licença dos dados: CC BY 4.0 — o site deve creditar classicwowforever.com com link.
 * Nomes de magias e itens pertencem à Blizzard Entertainment.
 *
 * Tradução: se data-raw/SpellName.csv (ptBR) e data-raw/enUS/SpellName.csv
 * existirem (exportados com wow.export), o código de cada macro ganha uma versão
 * com os nomes das magias em português (campo codePt), para colar no cliente pt-BR.
 *
 * Uso:
 *   npm run macros:fetch               (todas as classes)
 *   npm run macros:fetch -- warrior    (só uma classe)
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMacrosHtml } from "./lib/parse-macros.mjs";
import { buildSpellDictionary, translateMacroCode } from "./lib/translate-macros.mjs";

const CLASSES = ["warrior", "paladin", "hunter", "rogue", "priest", "shaman", "mage", "warlock", "druid"];

const SOURCE = "https://classicwowforever.com/macros";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "data", "macros");
const rawDir = path.join(root, "data-raw");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchClass(cls, dict) {
  const url = `${SOURCE}/${cls}/`;
  const res = await fetch(url, { headers: { "User-Agent": "sepultura-guild-armory (macros)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const html = await res.text();
  const { sections } = parseMacrosHtml(html);
  const total = sections.reduce((n, s) => n + s.macros.length, 0);
  if (!sections.length || !total) throw new Error(`nenhuma macro encontrada em ${url} (o layout do site mudou?)`);

  const misses = new Set();
  if (dict) {
    for (const s of sections)
      for (const m of s.macros) {
        const t = translateMacroCode(m.code, dict);
        m.codePt = t.code;
        if (t.untranslated.length) {
          m.untranslated = t.untranslated;
          t.untranslated.forEach((n) => misses.add(n));
        }
      }
  }

  // "Reviewed <time dateTime="2026-11-03">…</time>"
  const reviewed = html.match(/Reviewed\s*<time[^>]*dateTime="([0-9-]+)"/i)?.[1] ?? null;

  return {
    data: {
      slug: cls,
      fetched: new Date().toISOString(),
      reviewed,
      translated: Boolean(dict),
      attribution: {
        text: "Macros: Classic WoW Forever, licenciadas sob CC BY 4.0.",
        url: `${SOURCE}/${cls}/`,
        license: "CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      },
      sections,
    },
    total,
    misses,
  };
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const targets = only.length ? CLASSES.filter((c) => only.includes(c)) : CLASSES;
  if (!targets.length) throw new Error(`Classe inválida. Use uma de: ${CLASSES.join(", ")}`);

  const dict = buildSpellDictionary(rawDir);
  console.log(
    dict
      ? `Tradução pt-BR ativa (${dict.size} nomes de magias de data-raw/).`
      : "Sem data-raw/SpellName.csv: as macros ficam só em inglês.",
  );

  await mkdir(outDir, { recursive: true });
  const failures = [];
  const allMisses = new Set();

  for (const [i, cls] of targets.entries()) {
    if (i > 0) await sleep(500); // gentil com o servidor deles
    process.stdout.write(`→ ${cls}... `);
    try {
      const { data, total, misses } = await fetchClass(cls, dict);
      misses.forEach((n) => allMisses.add(n));
      await writeFile(path.join(outDir, `${cls}.json`), JSON.stringify(data, null, 2) + "\n", "utf8");
      console.log(`ok (${total} macros, ${data.sections.length} seções${misses.size ? `, ${misses.size} nomes sem tradução` : ""})`);
    } catch (err) {
      failures.push(cls);
      console.log(`FALHOU — ${err.message}`);
    }
  }

  if (allMisses.size) console.log(`\nSem tradução (ficaram em inglês): ${[...allMisses].sort().join(", ")}`);
  if (failures.length) {
    console.log(`\nFalharam: ${failures.join(", ")}. Rode de novo: npm run macros:fetch -- ${failures.join(" ")}`);
    process.exitCode = 1;
  } else {
    console.log(`\nArquivos salvos em src/data/macros/. Crédito obrigatório: classicwowforever.com (CC BY 4.0).`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
