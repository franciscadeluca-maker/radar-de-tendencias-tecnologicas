import { CATEGORIES, type AgentExecutionLog, type AgentStatus, type TimelinePoint, type Trend } from "./types";

/** Datos ficticios de ejemplo, usados mientras no haya webhooks de n8n configurados. */

export const MOCK_TRENDS: Trend[] = [
  {
    id: "tr-015",
    title: "Baterías de sodio-ion para almacenamiento estacionario",
    summary: "Gemini identifica un aumento sostenido de anuncios de fabricantes asiáticos y europeos que posicionan al sodio-ion como alternativa de menor costo al litio-ferrofosfato para almacenamiento en red, con menor dependencia de minerales críticos.",
    insights: ["Costo por kWh proyectado 20–30 % menor que LFP hacia 2028.", "Tres gigafábricas anunciadas en el último trimestre.", "Mejor desempeño en climas fríos, relevante para la Patagonia."],
    category: "Almacenamiento Energético", timeHorizon: "Corto Plazo", relevanceScore: 94,
    detectedAt: "2026-11-13T09:20:00Z", sourceName: "BloombergNEF", sourceUrl: "https://about.bnef.com/",
    keywords: ["sodio-ion", "BESS", "minerales críticos"],
  },
  {
    id: "tr-014",
    title: "Centrales eléctricas virtuales (VPP) residenciales",
    summary: "Se detecta una expansión de programas que agregan baterías domiciliarias, bombas de calor y cargadores de vehículos para ofrecer servicios de flexibilidad a la red, coordinados por software en tiempo real.",
    insights: ["Distribuidoras de EE. UU. y Australia superan 1 GW agregado.", "Modelos de remuneración por respuesta a la demanda en discusión regulatoria."],
    category: "Redes Inteligentes", timeHorizon: "Corto Plazo", relevanceScore: 89,
    detectedAt: "2026-11-11T14:05:00Z", sourceName: "IEEE Spectrum", sourceUrl: "https://spectrum.ieee.org/topic/energy/",
    keywords: ["VPP", "flexibilidad", "DER"],
  },
  {
    id: "tr-013",
    title: "Pronóstico de generación renovable con modelos fundacionales",
    summary: "Modelos de IA entrenados con datos meteorológicos globales mejoran la precisión del pronóstico solar y eólico a 48 horas, reduciendo la necesidad de reservas operativas en el despacho.",
    insights: ["Error medio reducido hasta un 25 % frente a modelos numéricos tradicionales.", "Operadores de red europeos inician pilotos en 2026."],
    category: "IA y Automatización", timeHorizon: "Corto Plazo", relevanceScore: 91,
    detectedAt: "2026-11-09T11:40:00Z", sourceName: "Nature Energy", sourceUrl: "https://www.nature.com/nenergy/",
    keywords: ["forecasting", "IA", "despacho"],
  },
  {
    id: "tr-012",
    title: "Electrolizadores PEM de alta eficiencia",
    summary: "Nuevos catalizadores con menor contenido de iridio permiten electrolizadores PEM más baratos, un paso clave para que el hidrógeno verde compita con el hidrógeno gris en la industria.",
    insights: ["Reducción del 60 % en uso de iridio por MW.", "Proyectos de escala gigavatio anunciados en Chile y Australia."],
    category: "Hidrógeno Verde", timeHorizon: "Mediano Plazo", relevanceScore: 84,
    detectedAt: "2026-11-05T16:30:00Z", sourceName: "IEA", sourceUrl: "https://www.iea.org/energy-system/low-emission-fuels/hydrogen",
    keywords: ["PEM", "electrólisis", "iridio"],
  },
  {
    id: "tr-011",
    title: "Celdas solares tándem perovskita-silicio",
    summary: "Fabricantes reportan módulos tándem comerciales con eficiencias superiores al 28 %, aunque la durabilidad a largo plazo sigue siendo el principal interrogante para su adopción masiva.",
    insights: ["Récord de laboratorio por encima del 34 %.", "Primeras líneas piloto de producción en Europa y China."],
    category: "Energía Solar", timeHorizon: "Mediano Plazo", relevanceScore: 87,
    detectedAt: "2026-10-28T10:10:00Z", sourceName: "PV Magazine", sourceUrl: "https://www.pv-magazine.com/",
    keywords: ["perovskita", "tándem", "eficiencia"],
  },
  {
    id: "tr-010",
    title: "Carga bidireccional vehículo-a-red (V2G)",
    summary: "La estandarización de la norma ISO 15118-20 y nuevos modelos de vehículos compatibles impulsan pilotos donde las flotas eléctricas devuelven energía a la red en horas pico.",
    insights: ["Flotas de buses escolares como primer caso de negocio.", "Requiere actualización de tarifas de inyección."],
    category: "Movilidad Eléctrica", timeHorizon: "Mediano Plazo", relevanceScore: 78,
    detectedAt: "2026-10-15T15:25:00Z", sourceName: "Electrek", sourceUrl: "https://electrek.co/",
    keywords: ["V2G", "ISO 15118", "flotas"],
  },
  {
    id: "tr-009",
    title: "Mercados de flexibilidad local",
    summary: "Reguladores europeos habilitan mercados donde las distribuidoras contratan flexibilidad a consumidores y generadores locales para evitar inversiones en refuerzo de redes.",
    insights: ["Reino Unido y Países Bajos lideran la implementación.", "Antecedente relevante para futuras reformas en América Latina."],
    category: "Regulación", timeHorizon: "Mediano Plazo", relevanceScore: 72,
    detectedAt: "2026-09-29T09:00:00Z", sourceName: "Comisión Europea", sourceUrl: "https://energy.ec.europa.eu/",
    keywords: ["flexibilidad", "DSO", "regulación"],
  },
  {
    id: "tr-008",
    title: "Gemelos digitales de redes de distribución",
    summary: "Distribuidoras adoptan réplicas digitales de su red alimentadas por medidores inteligentes para simular contingencias, planificar inversiones y detectar pérdidas no técnicas.",
    insights: ["Reducción de pérdidas no técnicas reportada entre 8 % y 15 %.", "Integración con sistemas GIS y SCADA existentes."],
    category: "Redes Inteligentes", timeHorizon: "Corto Plazo", relevanceScore: 81,
    detectedAt: "2026-09-12T13:50:00Z", sourceName: "Utility Dive", sourceUrl: "https://www.utilitydive.com/",
    keywords: ["gemelo digital", "AMI", "pérdidas"],
  },
  {
    id: "tr-007",
    title: "Almacenamiento térmico en arena y sales",
    summary: "Sistemas de almacenamiento térmico de bajo costo convierten excedentes renovables en calor industrial, ofreciendo una vía de descarbonización para procesos difíciles de electrificar.",
    insights: ["Costo de capital inferior a 20 USD/kWh térmico.", "Aplicaciones en alimentos, papel y calefacción distrital."],
    category: "Almacenamiento Energético", timeHorizon: "Mediano Plazo", relevanceScore: 69,
    detectedAt: "2026-08-21T12:00:00Z", sourceName: "MIT Technology Review", sourceUrl: "https://www.technologyreview.com/topic/climate-change/",
    keywords: ["almacenamiento térmico", "calor industrial"],
  },
  {
    id: "tr-006",
    title: "Agentes de IA para operación de centros de control",
    summary: "Operadores de red evalúan agentes de IA que asisten a los despachadores sugiriendo maniobras, priorizando alarmas y redactando reportes de incidentes en tiempo real.",
    insights: ["Enfoque de 'humano en el circuito' como requisito regulatorio.", "Riesgos de ciberseguridad asociados a la automatización."],
    category: "IA y Automatización", timeHorizon: "Mediano Plazo", relevanceScore: 76,
    detectedAt: "2026-07-30T08:45:00Z", sourceName: "EPRI", sourceUrl: "https://www.epri.com/",
    keywords: ["agentes", "SCADA", "despacho"],
  },
  {
    id: "tr-005",
    title: "Hubs de hidrógeno y amoníaco verde para exportación",
    summary: "Se consolidan polos portuarios que combinan generación renovable, electrólisis y síntesis de amoníaco para exportar energía a Europa y Asia.",
    insights: ["Argentina, Chile y Brasil aparecen entre los destinos de inversión.", "Dependencia de acuerdos de certificación de origen."],
    category: "Hidrógeno Verde", timeHorizon: "Largo Plazo", relevanceScore: 74,
    detectedAt: "2026-06-18T10:30:00Z", sourceName: "Hydrogen Council", sourceUrl: "https://hydrogencouncil.com/",
    keywords: ["amoníaco", "exportación", "puertos"],
  },
  {
    id: "tr-004",
    title: "Agrivoltaica a escala comercial",
    summary: "La combinación de paneles solares elevados con cultivos agrícolas gana tracción por su doble uso del suelo y beneficios en ahorro de agua para los cultivos.",
    insights: ["Marcos regulatorios específicos en Francia, Italia y Japón.", "Aumentos de rendimiento en cultivos sensibles al calor."],
    category: "Energía Solar", timeHorizon: "Corto Plazo", relevanceScore: 66,
    detectedAt: "2026-05-07T14:20:00Z", sourceName: "PV Magazine", sourceUrl: "https://www.pv-magazine.com/",
    keywords: ["agrivoltaica", "uso del suelo"],
  },
  {
    id: "tr-003",
    title: "Camiones eléctricos de carga pesada",
    summary: "Nuevos corredores de carga de megavatios y la caída del costo de las baterías habilitan rutas logísticas eléctricas de media distancia.",
    insights: ["Estándar MCS de carga de megavatios en despliegue.", "Paridad de costo total de propiedad estimada para 2028."],
    category: "Movilidad Eléctrica", timeHorizon: "Mediano Plazo", relevanceScore: 70,
    detectedAt: "2026-03-26T09:35:00Z", sourceName: "BloombergNEF", sourceUrl: "https://about.bnef.com/",
    keywords: ["MCS", "logística", "carga pesada"],
  },
  {
    id: "tr-002",
    title: "Taxonomías verdes y divulgación climática obligatoria",
    summary: "La adopción de las normas ISSB y taxonomías regionales obliga a las empresas energéticas a reportar emisiones y riesgos climáticos con estándares comparables.",
    insights: ["Impacto directo en el acceso a financiamiento.", "Varios países de la región en etapa de consulta pública."],
    category: "Regulación", timeHorizon: "Corto Plazo", relevanceScore: 63,
    detectedAt: "2026-02-11T11:00:00Z", sourceName: "IFRS Foundation", sourceUrl: "https://www.ifrs.org/groups/international-sustainability-standards-board/",
    keywords: ["ISSB", "taxonomía", "ESG"],
  },
  {
    id: "tr-001",
    title: "Supergrids HVDC entre países",
    summary: "Proyectos de transmisión en corriente continua de alta tensión conectan mercados eléctricos de distintos países, permitiendo compartir excedentes renovables a grandes distancias.",
    insights: ["Interconexiones submarinas de más de 1.000 km en desarrollo.", "Desafíos de gobernanza y reparto de costos entre países."],
    category: "Redes Inteligentes", timeHorizon: "Largo Plazo", relevanceScore: 58,
    detectedAt: "2025-12-16T13:15:00Z", sourceName: "IEEE Spectrum", sourceUrl: "https://spectrum.ieee.org/topic/energy/",
    keywords: ["HVDC", "interconexión", "transmisión"],
  },
];

const MONTHS = ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];

const BASE: Record<(typeof CATEGORIES)[number], [number, number]> = {
  "Almacenamiento Energético": [210, 1.06],
  "Redes Inteligentes": [180, 1.055],
  "Hidrógeno Verde": [150, 1.03],
  "IA y Automatización": [120, 1.09],
  "Energía Solar": [190, 1.025],
  "Movilidad Eléctrica": [160, 1.035],
  Regulación: [90, 1.02],
};

export const MOCK_TIMELINE: TimelinePoint[] = MONTHS.map((month, i) => ({
  month,
  values: Object.fromEntries(
    CATEGORIES.map((c, ci) => {
      const [start, growth] = BASE[c];
      const noise = 1 + Math.sin((i + 1) * (ci + 2) * 0.9) * 0.07;
      return [c, Math.round(start * Math.pow(growth, i) * noise)];
    }),
  ) as TimelinePoint["values"],
}));

export const MOCK_LOGS: AgentExecutionLog[] = [
  { id: "ex-0128", startedAt: "2026-11-14T06:00:00Z", status: "Completado", sourcesScanned: 46, newTrends: 1, durationSeconds: 842, trigger: "Programada", model: "Gemini 2.5 Pro" },
  { id: "ex-0127", startedAt: "2026-11-13T06:00:00Z", status: "Completado", sourcesScanned: 46, newTrends: 2, durationSeconds: 798, trigger: "Programada", model: "Gemini 2.5 Pro" },
  { id: "ex-0126", startedAt: "2026-11-12T15:22:00Z", status: "Completado", sourcesScanned: 18, newTrends: 0, durationSeconds: 341, trigger: "Manual", model: "Gemini 2.5 Flash" },
  { id: "ex-0125", startedAt: "2026-11-12T06:00:00Z", status: "Error", sourcesScanned: 9, newTrends: 0, durationSeconds: 221, trigger: "Programada", model: "Gemini 2.5 Pro", errorMessage: "Tiempo de espera agotado al consultar IEEE Xplore." },
  { id: "ex-0124", startedAt: "2026-11-11T06:00:00Z", status: "Completado", sourcesScanned: 45, newTrends: 1, durationSeconds: 815, trigger: "Programada", model: "Gemini 2.5 Pro" },
  { id: "ex-0123", startedAt: "2026-11-10T06:00:00Z", status: "Completado", sourcesScanned: 45, newTrends: 0, durationSeconds: 769, trigger: "Programada", model: "Gemini 2.5 Pro" },
];

export const MOCK_AGENT_STATUS: AgentStatus = {
  state: "Activo",
  workflowName: "Vigilancia energética · n8n",
  schedule: "Todos los días, 03:00 (hora de Buenos Aires)",
  model: "Gemini 2.5 Pro",
  sourcesConfigured: 46,
};

/** Tendencias que la búsqueda simulada puede "descubrir". */
export const MOCK_DISCOVERABLE: Omit<Trend, "id" | "detectedAt">[] = [
  {
    title: "Baterías de hierro-aire de larga duración",
    summary: "Gemini detecta los primeros despliegues comerciales de baterías de hierro-aire capaces de almacenar energía durante 100 horas, orientadas a cubrir períodos prolongados sin viento ni sol.",
    insights: ["Materiales abundantes y de bajo costo.", "Contratos firmados con utilities en EE. UU."],
    category: "Almacenamiento Energético", timeHorizon: "Mediano Plazo", relevanceScore: 86,
    sourceName: "Utility Dive", sourceUrl: "https://www.utilitydive.com/", keywords: ["hierro-aire", "larga duración"],
  },
  {
    title: "Mantenimiento predictivo de parques eólicos con visión artificial",
    summary: "Drones con cámaras y modelos de visión detectan daños en palas de aerogeneradores antes de que generen fallas, reduciendo paradas no programadas.",
    insights: ["Inspecciones hasta 10 veces más rápidas.", "Integración con plataformas de gestión de activos."],
    category: "IA y Automatización", timeHorizon: "Corto Plazo", relevanceScore: 79,
    sourceName: "Windpower Monthly", sourceUrl: "https://www.windpowermonthly.com/", keywords: ["eólica", "drones", "visión artificial"],
  },
  {
    title: "Tarifas dinámicas por franja horaria para hogares",
    summary: "Reguladores impulsan tarifas eléctricas que varían según la hora para incentivar el consumo cuando abunda la generación renovable.",
    insights: ["Requiere medición inteligente masiva.", "Ahorros de 10–20 % para usuarios flexibles."],
    category: "Regulación", timeHorizon: "Corto Plazo", relevanceScore: 71,
    sourceName: "IEA", sourceUrl: "https://www.iea.org/", keywords: ["tarifas", "demanda"],
  },
];
