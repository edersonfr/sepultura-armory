import { TALENT_CLASSES } from "@/lib/talents";
import { EVENTS, recordEvent, type BuildEvent } from "@/lib/build-stats";

/**
 * Recebe eventos da calculadora: { cls: "paladin", build: "05032-...", event: "planned" }.
 * Enviado com navigator.sendBeacon, então a resposta é ignorada pelo cliente.
 */
export async function POST(req: Request) {
  let body: { cls?: unknown; build?: unknown; event?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const cls = TALENT_CLASSES.find((c) => c.dataSlug === body.cls);
  const event = body.event as BuildEvent;
  if (!cls || !EVENTS.includes(event) || typeof body.build !== "string") {
    return new Response(null, { status: 400 });
  }

  const result = await recordEvent(cls.dataSlug, cls.data, body.build, event);
  return new Response(null, { status: result === "invalid" ? 400 : 204 });
}
