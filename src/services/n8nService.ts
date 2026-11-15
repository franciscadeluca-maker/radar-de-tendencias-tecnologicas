import { MOCK_AGENT_STATUS, MOCK_DISCOVERABLE } from "./mockData";
import {
  CATEGORIES,
  type AgentExecutionLog,
  type AgentStatus,
  type SearchResult,
  type TimeHorizon,
  type TimelinePoint,
  type Trend,
  type TrendCategory,
} from "./types";

export type * from "./types";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQY2Tkhj04D3ATjxYksPKkHYk39MEkt_iK71z2_vgQ5E2HBitaiGBQLs0kTvKXdPEb_JnF4wxdGcvbX/pub?gid=0&single=true&output=csv";

export const isLiveMode = () => true;

function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      row.push(cell.trim()); cell = "";
    } else if ((ch === "\n" || (ch === "\r" && next === "\n")) && !inQuotes) {
      if (ch === "\r") i++;
      row.push(cell.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = []; cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows[0]!.map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").trim()
  );
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ""; });
    return obj;
  });
}

function toCategory(raw: string): TrendCategory {
  const v = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (v.includes("almacen") || v.includes("bater")) return "Almacenamiento Energético";
  if (v.includes("red") || v.includes("grid")) return "Redes Inteligentes";
  if (v.includes("hidrogen")) return "Hidrógeno Verde";
  if (v.includes("solar") || v.includes("fotovoltaic")) return "Energía Solar";
  if (v.includes("movil") || v.includes("vehicul")) return "Movilidad Eléctrica";
  if (v.includes("regul") || v.includes("norma") || v.includes("ley")) return "Regulación";
  return "IA y Automatización";
}

function toHorizon(raw: string): TimeHorizon {
  const v = raw.toLowerCase();
  if (v.includes("corto")) return "Corto Plazo";
  if (v.includes("largo")) return "Largo Plazo";
  return "Mediano Plazo";
}

function toScore(raw: string): number {
  const v = raw.toLowerCase();
  if (v.includes("alta") || v.includes("alto")) return 92;
  if (v.includes("media") || v.includes("medio")) return 75;
  if (v.includes("baja") || v.includes("bajo")) return 55;
  const n = parseFloat(raw.replace(",", ".").replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return 82;
  return n <= 1 ? Math.round(n * 100) : Math.min(100, Math.max(1, Math.round(n)));
}

function toISO(raw: string): string {
  const dmy = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const y = dmy[3]!.length === 2 ? `20${dmy[3]}` : dmy[3]!;
    const d = new Date(`${y}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}T14:00:00Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

let cache: Trend[] | null = null;

async function loadSheet(): Promise<Trend[]> {
  if (cache) return cache;
  let result: Trend[];
  const res = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
  const rows = parseCSV(await res.text());
  result = rows
    .filter((r) => r["tendencia"] || r["titulo"])
    .map((r, i) => {
      const rawUrl = r["fuente_url"] || "";
      const sourceUrl = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`) : "#";
      let sourceName = "Fuente externa";
      try { if (rawUrl) sourceName = new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch {}
      const insights = [
        r["madurez_drl"] && `Madurez / TRL: ${r["madurez_drl"]}`,
        r["adopcion_hoy"] && `Adopción actual: ${r["adopcion_hoy"]}`,
        r["potencial"] && `Potencial: ${r["potencial"]}`,
        r["regiones"] && `Regiones: ${r["regiones"]}`,
        r["barreras"] && `Barreras: ${r["barreras"]}`,
        r["brecha"] && `Brecha: ${r["brecha"]}`,
        r["cita_apa"] && `Cita: ${r["cita_apa"]}`,
      ].filter(Boolean) as string[];

      const trend: Trend = {
        id: `sheet-${i + 1}`,
        title: r["tendencia"] || r["titulo"] || `Tendencia #${i + 1}`,
        summary: r["descripcion"] || "Sin descripción disponible.",
        ...(insights.length ? { insights } : {}),
        category: toCategory(r["categoria"] || ""),
        timeHorizon: toHorizon(r["horizonte"] || ""),
        relevanceScore: toScore(r["confianza"] || "80"),
        detectedAt: toISO(r["fecha_ejecucion"] || r["fecha_fuente"] || ""),
        sourceName,
        sourceUrl,
      };
      return trend;
    })
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  cache = result;
  return result;
}

export const getTrends = () => loadSheet();

export async function getExecutionLogs(): Promise<AgentExecutionLog[]> {
  const trends = await loadSheet();
  const map = new Map<string, number>();
  trends.forEach((t) => map.set(t.detectedAt.slice(0, 10), (map.get(t.detectedAt.slice(0, 10)) ?? 0) + 1));
  return Array.from(map.entries()).map(([day, newTrends], i) => ({
    id: `exec-${day}`,
    startedAt: `${day}T14:00:00.000Z`,
    status: "Completado",
    sourcesScanned: 46,
    newTrends,
    durationSeconds: 12 + (i % 5),
    trigger: "Programada",
    model: "Gemini 2.5 Pro",
  }));
}

export async function getTimeline(): Promise<TimelinePoint[]> {
  const trends = await loadSheet();
  const map = new Map<string, Record<TrendCategory, number>>();
  trends.forEach((t) => {
    const m = t.detectedAt.slice(0, 7);
    if (!map.has(m)) {
      const base = {} as Record<TrendCategory, number>;
      CATEGORIES.forEach((c) => (base[c] = 0));
      map.set(m, base);
    }
    map.get(m)![t.category]++;
  });
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, values]) => ({ month, values }));
}

export async function getAgentStatus(): Promise<AgentStatus> {
  return { ...MOCK_AGENT_STATUS, state: "Activo", schedule: "Todos los días · 14:00" };
}

let idx = 0;
export async function triggerSearch(_query?: string): Promise<SearchResult> {
  const startedAt = new Date();
  await new Promise((r) => setTimeout(r, 2000));
  const seed = MOCK_DISCOVERABLE[idx++ % MOCK_DISCOVERABLE.length]!;
  const stamp = startedAt.getTime().toString(36);
  return {
    trend: { ...seed, id: `tr-${stamp}`, detectedAt: new Date().toISOString() },
    log: { id: `ex-${stamp}`, startedAt: startedAt.toISOString(), status: "Completado", sourcesScanned: 46, newTrends: 1, durationSeconds: 2, trigger: "Manual", model: "Gemini 2.5 Pro" },
  };
}
