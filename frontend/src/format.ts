import type { OrderStatus } from "./types/order";
import { t, type MessageKey } from "./i18n";

const statusKey: Record<OrderStatus, MessageKey> = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
};

const stepCaptionKey: Record<OrderStatus, MessageKey> = {
    pending: "stepPending",
    processing: "stepProcessing",
    completed: "stepFinished",
};

export function statusLabel(status: OrderStatus): string {
    return t(statusKey[status]);
}

export function stepCaption(status: OrderStatus): string {
    return t(stepCaptionKey[status]);
}

export function formatAmount(amount: number): string {
    return new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: "BRL",
    }).format(amount);
}

export function formatDay(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
}

export function formatTime(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
}

export function formatDayAndTime(value: string): string {
    return `${formatDay(value)} - ${formatTime(value)}`;
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
