// Parser sem dependências do HTML das páginas de macros do classicwowforever.com.
// Usado por scripts/fetch-macros.mjs. Dados licenciados CC BY 4.0 (Classic WoW Forever).

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

const stripTags = (s) => s.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "");
const text = (s) => (s == null ? null : decode(stripTags(s)).replace(/\s+/g, " ").trim());
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
};
const inner = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : null;
};

function parseArticle(tag, body) {
  const head = inner(body, /<header class="mc-head">([\s\S]*?)<\/header>/) ?? "";
  const imgTag = head.match(/<img[^>]*>/)?.[0] ?? "";
  const src = attr(imgTag, "src") ?? "";
  const code = inner(body, /<pre class="mc-code"><code>([\s\S]*?)<\/code><\/pre>/);

  const m = {
    id: attr(tag, "id"),
    title: text(inner(head, /<h3>([\s\S]*?)<\/h3>/)),
    desc: text(inner(head, /<p>([\s\S]*?)<\/p>/)),
    icon: src.split("/").pop().replace(/\.jpg$/, ""),
    iconKind: src.includes("class-icons") ? "class" : "ability",
    code: code == null ? "" : decode(stripTags(code)),
    origin: attr(tag, "data-origin"),
  };

  const keysHtml = inner(body, /<ul class="mc-keys"[^>]*>([\s\S]*?)<\/ul>/);
  if (keysHtml) {
    const keys = [...keysHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, li]) => ({
      key: text(inner(li, /<kbd>([\s\S]*?)<\/kbd>/)),
      text: text(li.replace(/<kbd>[\s\S]*?<\/kbd>/, "")),
    }));
    if (keys.length) m.keys = keys;
  }

  const needs = inner(body, /<p class="mc-needs">([\s\S]*?)<\/p>/);
  if (needs) {
    const t = text(needs.replace(/<strong>[\s\S]*?<\/strong>/, ""));
    if (t) m.needs = t;
  }

  const level = text(inner(body, /<span class="mc-level">([\s\S]*?)<\/span>/));
  if (level) m.level = parseInt(level.replace(/\D/g, ""), 10) || null;

  return m;
}

/** Converte o HTML de /macros/<classe>/ em { sections: [...] }. */
export function parseMacrosHtml(html) {
  const sections = [];
  const secRe = /<section([^>]*class="mb-panel"[^>]*)>([\s\S]*?)<\/section>/g;
  for (const [, secAttrs, secBody] of html.matchAll(secRe)) {
    const tag = `<section${secAttrs}>`;
    const macros = [];
    const artRe = /(<article class="mc"[^>]*>)([\s\S]*?)<\/article>/g;
    for (const [, artTag, artBody] of secBody.matchAll(artRe)) {
      macros.push(parseArticle(artTag, artBody));
    }
    sections.push({
      id: attr(tag, "id"),
      name: text(inner(secBody, /<div class="mb-panel-head">\s*<h2>([\s\S]*?)<\/h2>/)),
      view: attr(tag, "data-view"),
      macros,
    });
  }
  return { sections };
}
