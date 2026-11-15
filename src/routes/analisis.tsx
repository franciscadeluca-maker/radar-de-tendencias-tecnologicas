import { createFileRoute, redirect } from "@tanstack/react-router";

// "Análisis" se fusionó con el Dashboard: la dirección vieja sigue funcionando y lleva al inicio.
export const Route = createFileRoute("/analisis")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true, statusCode: 301 });
  },
});
