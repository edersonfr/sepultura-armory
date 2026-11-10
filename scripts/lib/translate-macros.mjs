// Tradução automática do CÓDIGO das macros (nomes de magias) para o cliente pt-BR.
// No WoW, /cast e companhia só funcionam com o nome localizado da magia.
// Fonte: tabelas SpellName (ptBR + enUS) e Spell (NameSubtext) exportadas com wow.export.

import { readFileSync, existsSync } from "node:fs";

/** Parser CSV mínimo (separador ;) que respeita aspas e quebras de linha em campos. */
export function parseCsv(content, sep = ";") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (quoted) {
      if (c === '"') {
        if (content[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && content[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function loadTable(path) {
  const [header, ...rows] = parseCsv(readFileSync(path, "utf8"));
  return { header, rows };
}

/** Monta o dicionário inglês → português a partir de data-raw/. */
export function buildSpellDictionary(rawDir) {
  const ptPath = `${rawDir}/SpellName.csv`;
  const enPath = `${rawDir}/enUS/SpellName.csv`;
  const spellPath = `${rawDir}/Spell.csv`;
  if (!existsSync(ptPath) || !existsSync(enPath)) return null;

  const pt = new Map(loadTable(ptPath).rows.map((r) => [r[0], r[1]]));
  const subtext = new Map();
  if (existsSync(spellPath)) {
    const { header, rows } = loadTable(spellPath);
    const col = header.indexOf("NameSubtext_lang");
    for (const r of rows) subtext.set(r[0], r[col] ?? "");
  }

  // inglês (minúsculo) → contagem de cada tradução encontrada
  const votes = new Map();
  for (const [id, enName] of loadTable(enPath).rows) {
    if (!enName) continue;
    const ptName = pt.get(id);
    if (!ptName || ptName === enName) continue;
    const key = enName.toLowerCase();
    if (!votes.has(key)) votes.set(key, new Map());
    // magias de jogador costumam ter subtexto ("Grau 3", "Racial"…): valem mais
    const weight = subtext.get(id) ? 3 : 1;
    const v = votes.get(key);
    v.set(ptName, (v.get(ptName) ?? 0) + weight);
  }

  const dict = new Map();
  for (const [key, v] of votes) {
    const best = [...v.entries()].sort((a, b) => b[1] - a[1])[0][0];
    dict.set(key, best);
  }
  return dict;
}

// Textos de exemplo que o jogador troca pelo próprio item
const PLACEHOLDERS = {
  "two-hander name": "Nome da Arma de Duas Mãos",
  "one-hand name": "Nome da Arma de Uma Mão",
  "shield name": "Nome do Escudo",
  "off-hand name": "Nome da Arma Secundária",
  "main-hand name": "Nome da Arma Principal",
  "dagger name": "Nome da Adaga",
};

// Condições que usam nomes localizados de tipo de item
const CONDITION_WORDS = {
  shields: "Escudos",
  daggers: "Adagas",
};

const SPELL_CMDS = /^(\s*)(#showtooltip|#show|\/castsequence|\/castrandom|\/cast|\/cancelaura|\/use)(\s+)(.*)$/i;
const ITEM_CMDS = /^(\s*)(\/equipslot|\/equip)(\s+)(.*)$/i;

function translateName(raw, dict, misses) {
  const lead = raw.match(/^\s*!?/)[0];
  const trail = raw.match(/\s*$/)[0];
  const core = raw.slice(lead.length, raw.length - trail.length);
  if (!core || /^\d+$/.test(core)) return raw; // vazio ou slot (/use 13)

  const rank = core.match(/\s*\((?:Rank|Grau) (\d+)\)$/i);
  const name = rank ? core.slice(0, rank.index) : core;
  const key = name.toLowerCase();

  if (PLACEHOLDERS[key]) return lead + PLACEHOLDERS[key] + trail;
  const pt = dict.get(key);
  if (!pt) {
    misses.add(name);
    return raw;
  }
  return lead + pt + (rank ? `(Grau ${rank[1]})` : "") + trail;
}

const translateConditions = (conds) =>
  conds.replace(/(equipped:)([A-Za-z ]+)/gi, (m, p, w) =>
    CONDITION_WORDS[w.trim().toLowerCase()] ? p + CONDITION_WORDS[w.trim().toLowerCase()] : m,
  );

function translateArgs(cmd, rest, dict, misses) {
  const listCmd = /castsequence|castrandom/i.test(cmd);
  return rest
    .split(";")
    .map((seg) => {
      const m = seg.match(/^(\s*(?:\[[^\]]*\]\s*)*)([\s\S]*)$/);
      const conds = translateConditions(m[1]);
      let args = m[2];
      let reset = "";
      if (listCmd) {
        const r = args.match(/^(\s*reset=\S+\s+)/);
        if (r) { reset = r[1]; args = args.slice(reset.length); }
        args = args.split(",").map((a) => translateName(a, dict, misses)).join(",");
      } else args = translateName(args, dict, misses);
      return conds + reset + args;
    })
    .join(";");
}

/** Traduz o código de uma macro. Retorna { code, untranslated[] }. */
export function translateMacroCode(code, dict) {
  const misses = new Set();
  const lines = code.split("\n").map((line) => {
    let m = line.match(SPELL_CMDS);
    if (m) return m[1] + m[2] + m[3] + translateArgs(m[2], m[4], dict, misses);
    m = line.match(ITEM_CMDS);
    if (m) {
      // /equipslot [cond] 16 Nome — itens ficam como estão; só troca placeholders
      const out = m[4]
        .split(";")
        .map((seg) => {
          const s = seg.match(/^(\s*(?:\[[^\]]*\]\s*)*)(\s*\d+\s+)?([\s\S]*?)(\s*)$/);
          const ph = PLACEHOLDERS[s[3].toLowerCase()];
          return translateConditions(s[1]) + (s[2] ?? "") + (ph ?? s[3]) + s[4];
        })
        .join(";");
      return m[1] + m[2] + m[3] + out;
    }
    return line;
  });
  return { code: lines.join("\n"), untranslated: [...misses] };
}
