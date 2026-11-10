"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { MACRO_CHAR_LIMIT, ORIGIN_LABELS, keyLabel, type Macro } from "@/lib/macro-labels";

const iconSrc = (icon: string) => `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para navegadores sem permissão de clipboard
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function MacroCard({ macro, lang }: { macro: Macro; lang: "pt" | "en" }) {
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const usePt = lang === "pt" && Boolean(macro.codePt);
  const code = usePt ? macro.codePt! : macro.code;
  const length = code.length;
  const tooLong = length > MACRO_CHAR_LIMIT;
  const origin = ORIGIN_LABELS[macro.origin] ?? ORIGIN_LABELS.classic;

  const onCopy = async () => {
    const ok = await copyText(code);
    setStatus(ok ? "ok" : "fail");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <article id={macro.id} className="flex scroll-mt-24 flex-col rounded-lg border border-borda bg-aco p-4">
      <header className="flex items-start gap-3">
        <img
          src={iconSrc(macro.icon)}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          className="h-9 w-9 shrink-0 rounded border border-borda"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug text-marfim" lang="en">{macro.title}</h3>
          {macro.desc && (
            <p className="mt-1 text-sm leading-relaxed text-pedra" lang="en">{macro.desc}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copiar macro: ${macro.title}`}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-semibold transition ${
            status === "ok"
              ? "border-vil/50 bg-vil/10 text-vil"
              : status === "fail"
                ? "border-sangue-vivo/50 text-sangue-vivo"
                : "border-sangue bg-sangue text-marfim hover:bg-sangue-hover"
          }`}
        >
          {status === "ok" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {status === "ok" ? "Copiado!" : status === "fail" ? "Falhou" : "Copiar"}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {status === "ok" ? "Macro copiada" : status === "fail" ? "Não foi possível copiar" : ""}
        </span>
      </header>

      <div className="relative mt-3">
        <pre
          className="overflow-x-auto whitespace-pre-wrap break-words rounded border border-borda bg-onix px-3 py-2.5 font-mono text-[13px] leading-relaxed text-marfim"
          lang={usePt ? "pt-BR" : "en"}
        >
          <code>{code}</code>
        </pre>
        <span
          className={`absolute bottom-1.5 right-2 font-mono text-[10px] ${tooLong ? "text-sangue-vivo" : "text-pedra/70"}`}
          title={tooLong ? "Passa do limite de 255 caracteres do jogo" : "Caracteres usados (limite do jogo: 255)"}
        >
          {length}/{MACRO_CHAR_LIMIT}
        </span>
      </div>

      {usePt && macro.untranslated?.length ? (
        <p className="mt-2 text-xs text-brasa">
          Ficou em inglês: {macro.untranslated.join(", ")}. Troque pelo nome que aparece no seu cliente.
        </p>
      ) : null}
      {tooLong && (
        <p className="mt-2 text-xs text-sangue-vivo">
          Em português a macro passou de {MACRO_CHAR_LIMIT} caracteres: encurte antes de salvar no jogo.
        </p>
      )}

      {macro.keys?.length ? (
        <ul className="mt-3 space-y-1.5" aria-label="O que cada tecla faz">
          {macro.keys.map((k, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <kbd className="min-w-[4.5rem] shrink-0 rounded border border-borda bg-aco-alto px-1.5 py-0.5 text-center font-mono text-[11px] text-marfim">
                {keyLabel(k.key)}
              </kbd>
              <span className="text-pedra" lang="en">{k.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-3 text-xs">
        {macro.needs && (
          <p className="w-full text-pedra">
            <strong className="font-semibold text-marfim">Requer</strong>{" "}
            <span lang="en">{macro.needs}</span>
          </p>
        )}
        {macro.level ? (
          <span className="rounded border border-borda px-2 py-0.5 text-pedra">Nível {macro.level}+</span>
        ) : null}
        <span className={`rounded border px-2 py-0.5 ${origin.className}`}>{origin.label}</span>
      </footer>
    </article>
  );
}
