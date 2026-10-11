import type { CreateOrderInput, Order, OrderStatus } from "../types/order";

const statuses: readonly OrderStatus[] = ["pending", "processing", "finished"];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isOrderStatus(value: unknown): value is OrderStatus {
    return typeof value === "string" && statuses.some((status) => status === value);
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
        (value.image === null || typeof value.image === "string")
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
