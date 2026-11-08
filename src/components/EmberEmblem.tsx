"use client";

import { useEffect, useRef } from "react";

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  sway: number;
  swaySpeed: number;
}

interface Props {
  src: string;
  alt: string;
  /** Quantidade máxima de fagulhas simultâneas. */
  density?: number;
}

/**
 * Emblema da guilda "em brasa": a imagem estática ganha fagulhas subindo
 * (canvas) e um brilho de fogo pulsando (CSS). Respeita
 * prefers-reduced-motion e pausa fora da tela ou com a aba oculta.
 */
export function EmberEmblem({ src, alt, density = 110 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let visible = true;
    let last = performance.now();
    const embers: Ember[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // O canvas é maior que o emblema (sobra em cima para as fagulhas subirem).
    // Centro e raio do anel do emblema, em proporção do canvas.
    const ring = () => {
      const emblemSize = width / 1.2; // canvas tem 10% de folga em cada lado
      return {
        cx: width / 2,
        cy: height - emblemSize / 2,
        r: emblemSize * 0.36,
      };
    };

    const spawn = (): Ember => {
      const { cx, cy, r } = ring();
      // Nasce na borda do anel, preferindo a metade de cima e as laterais
      const angle = Math.PI + Math.random() * Math.PI * 1.1 - 0.05;
      const radius = r * (0.92 + Math.random() * 0.18);
      const maxLife = 1.6 + Math.random() * 2.4;
      const scale = Math.max(0.9, width / 1.2 / 380); // fagulha acompanha o tamanho do emblema
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius * 0.95,
        vx: (Math.random() - 0.5) * 14,
        vy: -(22 + Math.random() * 46),
        size: (1.1 + Math.random() * 2.3) * scale,
        life: 0,
        maxLife,
        hue: 12 + Math.random() * 30, // vermelho-alaranjado → âmbar
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 1.5 + Math.random() * 2.5,
      };
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Taxa de nascimento proporcional à densidade
      const target = density;
      if (embers.length < target) {
        embers.push(spawn());
        if (Math.random() < 0.5) embers.push(spawn());
      }

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life += dt;
        if (e.life >= e.maxLife) {
          embers.splice(i, 1);
          continue;
        }
        e.sway += e.swaySpeed * dt;
        e.x += (e.vx + Math.sin(e.sway) * 10) * dt;
        e.y += e.vy * dt;
        e.vy *= 0.995; // perde força ao subir

        const t = e.life / e.maxLife;
        // acende rápido, apaga devagar, com cintilação
        const flicker = 0.75 + Math.random() * 0.25;
        const alpha = (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85) * flicker;
        const light = 55 + (1 - t) * 20; // esfria ao subir
        const s = e.size * (1 - t * 0.5);

        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, s * 4);
        glow.addColorStop(0, `hsla(${e.hue + 10}, 100%, ${light + 15}%, ${alpha})`);
        glow.addColorStop(0.35, `hsla(${e.hue}, 100%, ${light}%, ${alpha * 0.55})`);
        glow.addColorStop(1, `hsla(${e.hue - 8}, 100%, 40%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, s * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      if (running && visible) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      if (running && visible) raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      start();
    });
    io.observe(wrap);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <div ref={wrapRef} className="ember-emblem relative">
      <img
        src={src}
        alt={alt}
        width={1024}
        height={1024}
        className="ember-emblem__img emblem-fade relative h-auto w-full"
      />
      {/* Brilho do fogo pulsando sobre o anel */}
      <div className="ember-emblem__glow" aria-hidden="true" />
      {/* Fagulhas: 10% de folga nas laterais e 35% acima do emblema */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] -right-[10%] -top-[35%] bottom-0 h-[135%] w-[120%]"
      />
    </div>
  );
}
