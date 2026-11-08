#!/usr/bin/env node
/**
 * Baixa as builds populares do WoW: Forever para as 9 classes e salva em
 * src/data/builds/<classe>.json.
 *
 * Fonte: Talents Forever (https://talentsforever.com/), via Firecrawl
 * Alexandria, capability "video-game-talents/builds". As contagens são do
 * próprio site (o que as pessoas planejam lá), não uma tier list.
 * O site deve creditar Talents Forever com o texto de "attribution".
 *
 * Uso:
 *   1. FIRECRAWL_API_KEY=... no .env.local
 *   2. npm run builds:fetch              (todas: 9 × 5 = 45 créditos)
 *      npm run builds:fetch -- warrior   (só uma classe)
 *      npm run builds:fetch -- --force   (baixa de novo as que já existem)
 *
 * Classes já baixadas são puladas. Respeita o limite por minuto do Firecrawl.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLASSES = ["warrior", "paladin", "hunter", "rogue", "priest", "shaman", "mage", "warlock", "druid"];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "data", "builds");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 8000;
const MAX_ATTEMPTS = 5;

async function loadKey() {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;
  const envFile = path.join(root, ".env.local");
  if (existsSync(envFile)) {
    const env = await readFile(envFile, "utf8");
    const m = env.match(/^\s*FIRECRAWL_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1].trim();
  }
  throw new Error("FIRECRAWL_API_KEY não encontrada. Adicione no .env.local.");
}

/** Procura o objeto com os dados das builds em qualquer nível da resposta. */
function findPayload(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 6) return null;
  if (Array.isArray(node.level_60) || Array.isArray(node.level_30)) return node;
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") {
      const found = findPayload(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function fetchOnce(key, cls) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      alexandria: {
        provider: "talentsforever-com",
        capability: "video-game-talents/builds",
        options: { class: cls },
      },
    }),
  });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* não-JSON */
  }
  const payload = res.ok && body?.success !== false ? findPayload(body) : null;
  if (!payload) {
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, `_debug-${cls}.json`), text, "utf8");
    const reason = body?.error || body?.message || `HTTP ${res.status}`;
    const err = new Error(`${cls}: ${reason} (resposta salva em src/data/builds/_debug-${cls}.json)`);
    err.status = res.status;
    throw err;
  }
  return { payload, credits: body?.creditsCost ?? 0 };
}

async function fetchClass(key, cls) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetchOnce(key, cls);
    } catch (err) {
      const msg = String(err.message);
      const limited = err.status === 429 || /rate limit/i.test(msg);
      if (!limited || attempt >= MAX_ATTEMPTS) throw err;
      const secs = Number(msg.match(/retry after (\d+)s/i)?.[1] || 30) + 3;
      process.stdout.write(`limite atingido, aguardando ${secs}s... `);
      await sleep(secs * 1000);
    }
  }
}

async function main() {
  const key = await loadKey();
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));
  const targets = only.length ? CLASSES.filter((c) => only.includes(c)) : CLASSES;
  if (!targets.length) throw new Error(`Classe inválida. Use uma de: ${CLASSES.join(", ")}`);

  await mkdir(outDir, { recursive: true });
  let credits = 0;
  let fetched = false;
  const failures = [];

  for (const cls of targets) {
    const file = path.join(outDir, `${cls}.json`);
    if (!force && existsSync(file)) {
      console.log(`→ ${cls}... já baixado, pulando`);
      continue;
    }
    if (fetched) await sleep(PAUSE_MS);
    fetched = true;
    process.stdout.write(`→ ${cls}... `);
    try {
      const { payload, credits: c } = await fetchClass(key, cls);
      credits += c;
      await writeFile(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
      console.log(`ok (${payload.level_60?.length ?? 0} builds nv. 60, ${payload.level_30?.length ?? 0} nv. 30)`);
    } catch (err) {
      failures.push(cls);
      console.log(`FALHOU — ${err.message}`);
    }
  }

  console.log(`\nCréditos Firecrawl usados: ${credits}`);
  if (failures.length) {
    console.log(`Falharam: ${failures.join(", ")}. Rode de novo: npm run builds:fetch -- ${failures.join(" ")}`);
    process.exitCode = 1;
  } else {
    console.log("Builds salvas em src/data/builds/. Crédito obrigatório: Talents Forever.");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
