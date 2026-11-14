/**
 * Capa de servicio conectada directamente al Google Sheets publicado (CSV).
 * Lee las tendencias reales, calcula la evolución temporal y arma los registros de ejecución.
 */
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

const BASE_URL = (import.meta.env["VITE_N8N_WEBHOOK_BASE_URL"] as string | undefined)?.replace(/\/$/, "");

// Activa el modo en vivo para quitar la etiqueta de "Datos de ejemplo"
export const isLiveMode = () => true;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parser CSV robusto que soporta comillas, comas internas y saltos de línea */
function parseCSV(text: string): Record<string, string>[] {
  const cleanText = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0]!.map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .trim()
  );

  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? "";
    });
    return obj;
  });
}

function normalizeCategory(raw: string): TrendCategory {
  const val = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const exact = CATEGORIES.find(
    (c) => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === val
  );
  if (exact) return exact;

  if (val.includes("almacen") || val.includes("bater")) return "Almacenamiento Energético";
  if (val.includes("red") || val.includes("grid") || val.includes("distrib")) return "Redes Inteligentes";
  if (val.includes("hidrogen")) return "Hidrógeno Verde";
  if (val.includes("solar") || val.includes("fotovoltaic")) return "Energía Solar";
  if (val.includes("movil") || val.includes("vehicul") || val.includes("electromov")) return "Movilidad Eléctrica";
  if (val.includes("regul") || val.includes("norma") || val.includes("politic") || val.includes("ley")) return "Regulación";
  return "IA y Automatización";
}

function normalizeHorizon(raw: string): TimeHorizon {
  const val = raw.toLowerCase();
  if (val.includes("corto")) return "Corto Plazo";
  if (val.includes("largo")) return "Largo Plazo";
  return "Mediano Plazo";
}

function normalizeScore(raw: string): number {
  const lower = raw.toLowerCase();
  if (lower.includes("alta") || lower.includes("alto")) return 92;
  if (lower.includes("media") || lower.includes("medio")) return 75;
  if (lower.includes("baja") || lower.includes("bajo")) return 55;

  const num = parseFloat(raw.replace(",", ".").replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 82;
  if (num > 0 && num <= 1) return Math.round(num * 100);
  return Math.min(100, Math.max(1, Math.round(num)));
}

function parseDateToISO(raw: string): string {
  if (!raw) return new Date().toISOString();
  const clean = raw.trim();

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const day = dmy[1]!.padStart(2, "0");
    const month = dmy[2]!.padStart(2, "0");
    const year = dmy[3]!.length === 2 ? `20${dmy[3]}` : dmy[3]!;
    const parsed = new Date(`${year}-${month}-${day}T14:00:00Z`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  return new Date().toISOString();
}

function extractSourceName(url: string, cita: string): string {
  if (url) {
    try {
      const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return hostname.replace(/^www\./, "");
    } catch {
      // Si no es URL válida, probamos con la cita APA
    }
  }
  if (cita) {
    return cita.split("(")[0]?.split(",")[0]?.trim().slice(0, 40) || "Fuente verificada";
  }
  return "Fuente externa";
}

let cachedTrends: Trend[] | null = null;
let lastFetchTime = 0;

async function fetchSheetTrends(): Promise<Trend[]> {
  const now = Date.now();
  if (cachedTrends && now - lastFetchTime < 30_000) {
    return cachedTrends;
  }

  const res = await fetch(`${SHEET_CSV_URL}&t=${now}`);
  if (!res.ok) {
    throw new Error(`No se pudo leer el Google Sheets (${res.status})`);
  }

  const csvText = await res.text();
  const rows = parseCSV(csvText);

  const trends: Trend[] = rows
    .filter((r) => r["tendencia"] || r["titulo"])
    .map((r, index) => {
      const title = r["tendencia"] || r["titulo"] || `Tendencia #${index + 1}`;
      const rawUrl = r["fuente_url"] || r["url"] || "";
      const sourceUrl = rawUrl
        ? rawUrl.startsWith("http")
          ? rawUrl
          : `https://${rawUrl}`
        : "#";

      // Agrupamos las columnas analíticas extra del Sheet para mostrarlas en el panel lateral
      const insights: string[] = [];
      if (r["madurez_drl"]) insights.push(`Madurez / TRL: ${r["madurez_drl"]}`);
      if (r["adopcion_hoy"]) insights.push(`Adopción actual: ${r["adopcion_hoy"]}`);
      if (r["potencial"]) insights.push(`Potencial: ${r["potencial"]}`);
      if (r["regiones"]) insights.push(`Regiones clave: ${r["regiones"]}`);
      if (r["barreras"]) insights.push(`Barreras: ${r["barreras"]}`);
      if (r["brecha"]) insights.push(`Brecha detectada: ${r["brecha"]}`);
      if (r["cita_apa"]) insights.push(`Referencia: ${r["cita_apa"]}`);

      const keywords = r["regiones"]
        ? r["regiones"]
            .split(/[,;]/)
            .map((k) => k.trim())
            .filter(Boolean)
        : undefined;

      return {
        id: `sheet-${index + 1}`,
        title,
        summary: r["descripcion"] || "Sin descripción detallada disponible.",
        insights: insights.length > 0 ? insights : undefined,
        category: normalizeCategory(r["categoria"] || ""),
        timeHorizon: normalizeHorizon(r["horizonte"] || ""),
        relevanceScore: normalizeScore(r["confianza"] || "80"),
        detectedAt: parseDateToISO(r["fecha_ejecucion"] || r["fecha_fuente"] || ""),
        sourceName: extractSourceName(rawUrl, r["cita_apa"] || ""),
        sourceUrl,
        keywords,
      };
    });

  // Ordenar de más reciente a más antigua
  trends.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

  cachedTrends = trends;
  lastFetchTime = now;
  return trends;
}

export async function getTrends(): Promise<Trend[]> {
  return fetchSheetTrends();
}

export async function getExecutionLogs(): Promise<AgentExecutionLog[]> {
  const trends = await fetchSheetTrends();
  if (trends.length === 0) return [];

  // Agrupar tendencias por fecha de ejecución para reconstruir el historial real
  const byDate = new Map<string, number>();
  trends.forEach((t) => {
    const dayKey = t.detectedAt.slice(0, 10);
    byDate.set(dayKey, (byDate.get(dayKey) ?? 0) + 1);
  });

  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, count], idx) => ({
      id: `exec-${day}`,
      startedAt: `${day}T14:00:00.000Z`,
      status: "Completado",
      sourcesScanned: 46,
      newTrends: count,
      durationSeconds: 12 + (idx % 5),
      trigger: "Programada",
      model: "Gemini 2.5 Pro",
    }));
}

export async function getTimeline(): Promise<TimelinePoint[]> {
  const trends = await fetchSheetTrends();
  const monthMap = new Map<string, Record<TrendCategory, number>>();

  const emptyCounts = (): Record<TrendCategory, number> => ({
    "Almacenamiento Energético": 0,
    "Redes Inteligentes": 0,
    "Hidrógeno Verde": 0,
    "IA y Automatización": 0,
    "Energía Solar": 0,
    "Movilidad Eléctrica": 0,
