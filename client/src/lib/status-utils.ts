export type OrderStatus = 
  | "pending" 
  | "accepted" 
  | "preparing" 
  | "ready" 
  | "dispatched" 
  | "delivered" 
  | "cancelled";

export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  preparing: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  ready: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  dispatched: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  delivered: "bg-green-500/20 text-green-400 border border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  preparing: "Em Produção",
  ready: "Pronto",
  dispatched: "Despachado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function getStatusBadgeClasses(status: string): string {
  const normalizedStatus = status.toLowerCase() as OrderStatus;
  return STATUS_BADGE_STYLES[normalizedStatus] ?? STATUS_BADGE_STYLES.pending;
}

export function getStatusLabel(status: string): string {
  const normalizedStatus = status.toLowerCase() as OrderStatus;
  return STATUS_LABELS[normalizedStatus] ?? status;
}
