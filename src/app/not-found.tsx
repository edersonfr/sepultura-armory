import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-sangue bg-sangue/20">
        <ShieldAlert className="h-8 w-8 text-sangue-claro" />
      </div>
      <h1 className="font-display text-2xl font-bold text-marfim">
        Personagem não encontrado no Armory
      </h1>
      <p className="text-sm text-pedra leading-relaxed">
        Este personagem pode estar abaixo do Nível 10 (e fora da lista de membros da
        Sepultura) ou ainda não deslogou para sincronizar os dados na API da
        Blizzard.
      </p>
      <Link
        href="/#membros"
        className="inline-flex items-center gap-2 rounded-lg bg-sangue px-5 py-2.5 text-sm font-semibold text-marfim transition hover:bg-sangue-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para os membros</span>
      </Link>
    </div>
  );
}
