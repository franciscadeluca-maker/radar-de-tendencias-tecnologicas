/**
 * Capa de servicio del agente de vigilancia (n8n + Gemini).
 *
 * Hoy cada función devuelve datos ficticios. Para conectar n8n, definí
 * VITE_N8N_WEBHOOK_BASE_URL (por ejemplo https://tu-n8n.com/webhook) y
 * creá en n8n estos webhooks:
 *
 *   GET  {base}/tendencias     -> Trend[]
 *   GET  {base}/ejecuciones    -> AgentExecutionLog[]
 *   GET  {base}/evolucion      -> TimelinePoint[]
 *   GET  {base}/estado         -> AgentStatus
 *   POST {base}/buscar         <- { query?: string }  -> SearchResult
 *
 * Con la variable definida, las funciones usan fetch() real; sin ella, usan los mocks.
 */
import {
  MOCK_AGENT_STATUS,
  MOCK_DISCOVERABLE,
  MOCK_LOGS,
  MOCK_TIMELINE,
  MOCK_TRENDS,
} from "./mockData";
import type { AgentExecutionLog, AgentStatus, SearchResult, TimelinePoint, Trend } from "./types";

export type * from "./types";

const BASE_URL = (import.meta.env["VITE_N8N_WEBHOOK_BASE_URL"] as string | undefined)?.replace(/\/$/, "");

export const isLiveMode = () => Boolean(BASE_URL);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`El agente respondió ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function getTrends(): Promise<Trend[]> {
  if (BASE_URL) return request<Trend[]>("/tendencias");
  return [...MOCK_TRENDS];
}

export async function getExecutionLogs(): Promise<AgentExecutionLog[]> {
  if (BASE_URL) return request<AgentExecutionLog[]>("/ejecuciones");
  return [...MOCK_LOGS];
}

export async function getTimeline(): Promise<TimelinePoint[]> {
  if (BASE_URL) return request<TimelinePoint[]>("/evolucion");
  return [...MOCK_TIMELINE];
}

export async function getAgentStatus(): Promise<AgentStatus> {
  if (BASE_URL) return request<AgentStatus>("/estado");
  return { ...MOCK_AGENT_STATUS };
}

let discoverIndex = 0;

/** Solicita al agente una nueva búsqueda. En modo demo simula 2,5 s de análisis. */
export async function triggerSearch(query?: string): Promise<SearchResult> {
  if (BASE_URL) {
    return request<SearchResult>("/buscar", { method: "POST", body: JSON.stringify({ query }) });
  }
  const startedAt = new Date();
  await wait(2500);
  const seed = MOCK_DISCOVERABLE[discoverIndex % MOCK_DISCOVERABLE.length]!;
  discoverIndex += 1;
  const stamp = startedAt.getTime().toString(36);
  const trend: Trend = { ...seed, id: `tr-${stamp}`, detectedAt: new Date().toISOString() };
  const log: AgentExecutionLog = {
    id: `ex-${stamp}`,
    startedAt: startedAt.toISOString(),
    status: "Completado",
    sourcesScanned: 46,
    newTrends: 1,
    durationSeconds: 3,
    trigger: "Manual",
    model: "Gemini 2.5 Pro",
  };
  return { trend, log };
}
