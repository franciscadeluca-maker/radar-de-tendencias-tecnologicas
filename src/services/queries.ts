import { queryOptions } from "@tanstack/react-query";

import { getAgentStatus, getExecutionLogs, getTrends } from "./n8nService";

export const trendsQuery = queryOptions({ queryKey: ["n8n", "trends"], queryFn: getTrends, staleTime: Infinity });
export const logsQuery = queryOptions({ queryKey: ["n8n", "logs"], queryFn: getExecutionLogs, staleTime: Infinity });
export const agentStatusQuery = queryOptions({ queryKey: ["n8n", "status"], queryFn: getAgentStatus, staleTime: Infinity });
