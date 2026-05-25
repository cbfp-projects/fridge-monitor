export type ExpiryStatus = "expired" | "soon" | "warning" | "ok";

export function daysUntil(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate + "T00:00:00");
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expirationDate: string): ExpiryStatus {
  const days = daysUntil(expirationDate);
  if (days < 0) return "expired";
  if (days <= 3) return "soon";
  if (days <= 7) return "warning";
  return "ok";
}

export function expiryLabel(expirationDate: string): string {
  const days = daysUntil(expirationDate);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days}d`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
