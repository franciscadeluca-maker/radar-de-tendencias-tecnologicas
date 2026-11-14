import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CATEGORIAS } from "./types";
import { loadEjecuciones, loadTendencias, requestNuevaBusqueda } from "./n8n.server";

export const getTendencias = createServerFn({ method: "GET" }).handler(async () => {
  return loadTendencias();
});

export const getEjecuciones = createServerFn({ method: "GET" }).handler(async () => {
  return loadEjecuciones();
});

const nuevaBusquedaSchema = z.object({
  consulta: z.string().trim().max(200).optional(),
  categorias: z.array(z.enum(CATEGORIAS)).max(CATEGORIAS.length).optional(),
});

export const solicitarBusqueda = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => nuevaBusquedaSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, ...(await requestNuevaBusqueda(data)) };
    } catch (err) {
      console.error("solicitarBusqueda", err);
      return { ok: false as const, error: "No se pudo contactar al agente. Intentá nuevamente." };
    }
  });
