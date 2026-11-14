import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { triggerSearch, type AgentExecutionLog, type Trend } from "@/services/n8nService";
import { logsQuery, trendsQuery } from "@/services/queries";

const PENDING_ID = "ex-pendiente";

/** Lanza una nueva búsqueda del agente y agrega el resultado al estado de la app. */
export function useRunSearch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (query?: string) => triggerSearch(query),
    onMutate: () => {
      const pending: AgentExecutionLog = {
        id: PENDING_ID,
        startedAt: new Date().toISOString(),
        status: "En proceso",
        sourcesScanned: 0,
        newTrends: 0,
        durationSeconds: 0,
        trigger: "Manual",
        model: "Gemini 2.5 Pro",
      };
      qc.setQueryData<AgentExecutionLog[]>(logsQuery.queryKey, (prev = []) => [pending, ...prev]);
    },
    onSuccess: ({ trend, log }) => {
      qc.setQueryData<AgentExecutionLog[]>(logsQuery.queryKey, (prev = []) => [
        log,
        ...prev.filter((l) => l.id !== PENDING_ID),
      ]);
      if (trend) {
        qc.setQueryData<Trend[]>(trendsQuery.queryKey, (prev = []) => [trend, ...prev]);
      }
      const n = log.newTrends;
      toast.success(`Búsqueda completada: ${n} ${n === 1 ? "nueva tendencia detectada" : "nuevas tendencias detectadas"}`, {
        description: trend ? trend.title : undefined,
      });
    },
    onError: (err) => {
      qc.setQueryData<AgentExecutionLog[]>(logsQuery.queryKey, (prev = []) =>
        prev.map((l) =>
          l.id === PENDING_ID ? { ...l, id: `ex-err-${Date.now()}`, status: "Error" as const, errorMessage: String(err) } : l,
        ),
      );
      toast.error("No se pudo completar la búsqueda", { description: "El agente no respondió. Intentá nuevamente." });
    },
  });
}
