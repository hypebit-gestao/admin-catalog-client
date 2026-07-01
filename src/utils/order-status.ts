export const STATUS_CONFIG = {
  PENDENT:     { label: "Novo pedido",      classes: "bg-amber-100 text-amber-800 border border-amber-200",    hex: "#d97706" },
  NEGOTIATING: { label: "Em negociação",    classes: "bg-orange-100 text-orange-800 border border-orange-200", hex: "#ea580c" },
  PAID:        { label: "Pago",             classes: "bg-blue-100 text-blue-800 border border-blue-200",        hex: "#2563eb" },
  SENT:        { label: "Enviado",          classes: "bg-indigo-100 text-indigo-800 border border-indigo-200",  hex: "#4338ca" },
  DELIVERED:   { label: "Entregue",         classes: "bg-emerald-100 text-emerald-800 border border-emerald-200", hex: "#059669" },
  CANCELLED:   { label: "Cancelado",        classes: "bg-red-100 text-red-800 border border-red-200",           hex: "#dc2626" },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

// Fluxo sequencial do pedido (exceto CANCELLED que pode vir de qualquer etapa)
export const STATUS_FLOW: StatusKey[] = [
  "PENDENT", "NEGOTIATING", "PAID", "SENT", "DELIVERED",
];

export const nextStatus = (current: string): StatusKey | null => {
  const idx = STATUS_FLOW.indexOf(current as StatusKey);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
};

export const formatterStatus = (status: string) =>
  STATUS_CONFIG[status as StatusKey]?.label ?? "Pendente";
