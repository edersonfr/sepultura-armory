import type { Config } from "tailwindcss";

/**
 * Códice da Horda — tokens do Design System (Figma: "Sepultura").
 * Os valores vivem em CSS custom properties (src/app/globals.css), em canais
 * RGB para permitir opacidade (ex.: bg-sangue/20), e espelham as variáveis do
 * Figma; aqui só os nomeamos para o Tailwind.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fundos e superfícies
        onix: "rgb(var(--color-onix-profundo) / <alpha-value>)", // background/default
        aco: {
          DEFAULT: "rgb(var(--color-aco-negro) / <alpha-value>)", // surface/card
          alto: "rgb(var(--color-aco-alto) / <alpha-value>)", // superfície elevada / hover
        },
        borda: "rgb(var(--color-borda-sutil) / <alpha-value>)", // border/default
        // Texto
        marfim: "rgb(var(--color-marfim-presa-de-kodo) / <alpha-value>)", // text/primary
        pedra: {
          DEFAULT: "rgb(var(--color-cinza-secundario) / <alpha-value>)", // text/secondary
          escura: "rgb(var(--color-texto-desabilitado) / <alpha-value>)", // text/disabled
        },
        // Ação e acento
        sangue: {
          DEFAULT: "rgb(var(--color-sangue-orc) / <alpha-value>)", // action/primary
          hover: "rgb(var(--color-sangue-hover) / <alpha-value>)",
          pressionado: "rgb(var(--color-sangue-pressionado) / <alpha-value>)",
          vivo: "rgb(var(--color-sangue-vivo) / <alpha-value>)", // border/accent, progress/fill
          claro: "rgb(var(--color-erro-claro) / <alpha-value>)", // texto avermelhado legível
        },
        // Status
        vil: {
          DEFAULT: "rgb(var(--color-verde-vil) / <alpha-value>)", // status/success
          profundo: "rgb(var(--color-verde-profundo) / <alpha-value>)", // status/success-surface
        },
        desabilitado: "rgb(var(--color-cinza-desabilitado) / <alpha-value>)",
        brasa: "rgb(var(--color-brasa) / <alpha-value>)", // somente ilustração
        // Cores de dado (qualidade de item) — nunca indicam estado de UI
        wow: {
          poor: "#9d9d9d",
          common: "#ffffff",
          uncommon: "#1eff00",
          rare: "#0070dd",
          epic: "#a335ee",
          legendary: "#ff8000",
          artifact: "#e6cc80",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
