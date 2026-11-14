import { format, formatDistanceStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const fmtFecha = (iso: string) => format(parseISO(iso), "d MMM yyyy", { locale: es });
export const fmtFechaHora = (iso: string) => format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });
export const fmtMes = (mes: string) => format(parseISO(`${mes}-01`), "MMM yy", { locale: es });
export const fmtNumero = (n: number) => new Intl.NumberFormat("es-AR").format(n);
export const fmtDuracion = (inicio: string, fin: string | null) =>
  fin ? formatDistanceStrict(parseISO(fin), parseISO(inicio), { locale: es }) : "—";
export const fmtRelativo = (iso: string, base: Date) =>
  formatDistanceStrict(parseISO(iso), base, { locale: es, addSuffix: true });
