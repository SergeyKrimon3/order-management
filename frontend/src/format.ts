import type { OrderStatus } from "./types/order";
import { t, type MessageKey } from "./i18n";

const statusKey: Record<OrderStatus, MessageKey> = {
  Pendente: "pending",
  Processando: "processing",
  Finalizado: "finished",
};

export function statusLabel(status: OrderStatus): string {
  return t(statusKey[status]);
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized.length === 0) {
    return null;
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}
