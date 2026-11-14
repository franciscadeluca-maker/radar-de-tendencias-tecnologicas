import { queryOptions } from "@tanstack/react-query";

import { getEjecuciones, getTendencias } from "./radar.functions";

export const tendenciasQuery = queryOptions({
  queryKey: ["radar", "tendencias"],
  queryFn: () => getTendencias(),
  staleTime: 60_000,
});

export const ejecucionesQuery = queryOptions({
  queryKey: ["radar", "ejecuciones"],
  queryFn: () => getEjecuciones(),
  staleTime: 30_000,
});
