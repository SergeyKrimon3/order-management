import type { CreateOrderInput, Order, OrderStatus, OrderStatusChange } from "../types/order";

const statuses: readonly OrderStatus[] = ["pending", "processing", "completed"];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isOrderStatus(value: unknown): value is OrderStatus {
    return typeof value === "string" && statuses.some((status) => status === value);
}

function isStatusChange(value: unknown): value is OrderStatusChange {
    return (
        isRecord(value) &&
        typeof value.id === "number" &&
        isOrderStatus(value.status) &&
        typeof value.occurredAt === "string"
    );
}

function isHistory(value: unknown): value is OrderStatusChange[] {
    return Array.isArray(value) && value.every(isStatusChange);
}

function isOrder(value: unknown): value is Order {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.id === "string" &&
        typeof value.customer === "string" &&
        typeof value.product === "string" &&
        typeof value.amount === "number" &&
        isOrderStatus(value.status) &&
        typeof value.createdAt === "string" &&
        typeof value.updatedAt === "string" &&
        (value.image === null || typeof value.image === "string") &&
        (value.repeatOf === null || typeof value.repeatOf === "string") &&
        (value.history === undefined || value.history === null || isHistory(value.history))
    );
}

async function readError(response: Response): Promise<string> {
    const body: unknown = await response.json().catch(() => null);
    if (isRecord(body) && typeof body.message === "string") {
        return body.message;
    }

    return "";
}

export async function listOrders(): Promise<Order[]> {
    const response = await fetch("/api/orders");
    if (!response.ok) {
        throw new Error(await readError(response));
    }

    const body: unknown = await response.json();
    if (!Array.isArray(body) || !body.every(isOrder)) {
        throw new Error("Invalid order list.");
    }

    return body;
}

export class OrderRequestError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function getOrder(id: string): Promise<Order> {
    const response = await fetch(`/api/orders/${encodeURIComponent(id)}`);
    if (!response.ok) {
        throw new OrderRequestError(response.status, await readError(response));
    }

    const body: unknown = await response.json();
    if (!isOrder(body)) {
        throw new OrderRequestError(response.status, "Invalid order.");
    }

    return body;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    const body: unknown = await response.json();
    if (!isOrder(body)) {
        throw new Error("Invalid order.");
    }

    return body;
}
