import { z } from "zod";

import { MOCK_EJECUCIONES, MOCK_SERIE_MENSUAL, MOCK_TENDENCIAS } from "./mock-data";
import {
  ejecucionSchema,
  serieMensualSchema,
  tendenciaSchema,
  type Ejecucion,
  type SerieMensual,
  type Tendencia,
} from "./types";

/**
 * Cliente de los webhooks de n8n. Si las variables de entorno no están
 * configuradas, se devuelven los datos de ejemplo (modo "demo").
 *
 *   N8N_TRENDS_WEBHOOK_URL   GET  -> { tendencias: Tendencia[], serieMensual?: SerieMensual[] }
 *   N8N_RUNS_WEBHOOK_URL     GET  -> { ejecuciones: Ejecucion[] }
 *   N8N_TRIGGER_WEBHOOK_URL  POST <- { consulta?, categorias?, solicitadoEn } -> { ejecucion: Ejecucion }
 *   N8N_WEBHOOK_SECRET       (opcional) se envía como cabecera X-Radar-Secret
 */

export type Modo = "demo" | "n8n";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

async function callWebhook(url: string, init: RequestInit = {}): Promise<unknown> {
  const secret = env("N8N_WEBHOOK_SECRET");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Radar-Secret": secret } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`n8n webhook ${url} -> ${res.status}: ${body}`);
    throw new Error(`El agente respondió con estado ${res.status}`);
  }
  return res.json();
}

const trendsPayload = z.object({
  tendencias: z.array(tendenciaSchema),
  serieMensual: z.array(serieMensualSchema).optional(),
});

export async function loadTendencias(): Promise<{
  modo: Modo;
  tendencias: Tendencia[];
  serieMensual: SerieMensual[];
}> {
  const url = env("N8N_TRENDS_WEBHOOK_URL");
  if (!url) {
    return { modo: "demo", tendencias: MOCK_TENDENCIAS, serieMensual: MOCK_SERIE_MENSUAL };
  }
  const data = trendsPayload.parse(await callWebhook(url, { method: "GET" }));
  return { modo: "n8n", tendencias: data.tendencias, serieMensual: data.serieMensual ?? [] };
}

const runsPayload = z.object({ ejecuciones: z.array(ejecucionSchema) });

export async function loadEjecuciones(): Promise<{ modo: Modo; ejecuciones: Ejecucion[] }> {
  const url = env("N8N_RUNS_WEBHOOK_URL");
  if (!url) return { modo: "demo", ejecuciones: MOCK_EJECUCIONES };
  const data = runsPayload.parse(await callWebhook(url, { method: "GET" }));
  return { modo: "n8n", ejecuciones: data.ejecuciones };
}

const triggerPayload = z.object({ ejecucion: ejecucionSchema });

export async function requestNuevaBusqueda(input: {
  consulta?: string;
  categorias?: string[];
}): Promise<{ modo: Modo; ejecucion: Ejecucion }> {
  const url = env("N8N_TRIGGER_WEBHOOK_URL");
  const ahora = new Date().toISOString();
  if (!url) {
    return {
      modo: "demo",
      ejecucion: {
        id: `run-demo-${Date.now().toString(36)}`,
        inicio: ahora,
        fin: null,
        estado: "en_curso",
        disparador: "manual",
        modelo: "Gemini 2.5 Pro",
        fuentesConsultadas: 0,
        publicacionesAnalizadas: 0,
        tendenciasNuevas: 0,
        tendenciasActualizadas: 0,
        consulta: input.consulta,
      },
    };
  }
  const data = triggerPayload.parse(
    await callWebhook(url, {
      method: "POST",
      body: JSON.stringify({ ...input, solicitadoEn: ahora }),
    }),
  );
  return { modo: "n8n", ejecucion: data.ejecucion };
}
