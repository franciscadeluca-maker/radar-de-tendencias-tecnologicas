import { format, formatDistanceStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const TZ_OFFSET_AR = -3 * 60; // Buenos Aires (UTC-3), fijo para evitar diferencias servidor/navegador

function toAR(iso: string) {
  const d = parseISO(iso);
  return new Date(d.getTime() + (d.getTimezoneOffset() + TZ_OFFSET_AR) * 60_000);
}

export const fmtDate = (iso: string) => format(toAR(iso), "d MMM yyyy", { locale: es });
export const fmtDateTime = (iso: string) => format(toAR(iso), "d MMM yyyy · HH:mm", { locale: es });
export const fmtTime = (iso: string) => format(toAR(iso), "HH:mm", { locale: es });
export const fmtMonth = (month: string) => format(parseISO(`${month}-01`), "MMM yy", { locale: es });
export const fmtNumber = (n: number) => new Intl.NumberFormat("es-AR").format(n);
export const fmtRelative = (iso: string, now: Date) =>
  formatDistanceStrict(parseISO(iso), now, { locale: es, addSuffix: true });

export function fmtDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}
